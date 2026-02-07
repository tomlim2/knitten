require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const USAGE_STATS_FILE = path.join(require('os').homedir(), '.claude', 'private', 'usage-stats.json');

async function migrate() {
    // Initialize Supabase
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
    );

    // Read existing JSON file
    if (!fs.existsSync(USAGE_STATS_FILE)) {
        console.log('No usage-stats.json found - nothing to migrate');
        return;
    }

    const content = fs.readFileSync(USAGE_STATS_FILE, 'utf-8');
    const stats = JSON.parse(content);

    console.log('Starting migration...');
    let migrated = 0;

    // Migrate skills
    for (const [item_id, data] of Object.entries(stats.skills || {})) {
        try {
            const { error } = await supabase
                .from('usage_tracking')
                .insert({
                    type: 'skills',
                    item_id,
                    count: data.count,
                    last_used: data.lastUsed
                });

            if (error) throw error;
            console.log(`✓ Migrated skill: ${item_id} (count: ${data.count})`);
            migrated++;
        } catch (error) {
            console.error(`✗ Failed to migrate skill ${item_id}:`, error.message);
        }
    }

    // Migrate commands
    for (const [item_id, data] of Object.entries(stats.commands || {})) {
        try {
            const { error } = await supabase
                .from('usage_tracking')
                .insert({
                    type: 'commands',
                    item_id,
                    count: data.count,
                    last_used: data.lastUsed
                });

            if (error) throw error;
            console.log(`✓ Migrated command: ${item_id} (count: ${data.count})`);
            migrated++;
        } catch (error) {
            console.error(`✗ Failed to migrate command ${item_id}:`, error.message);
        }
    }

    console.log(`\n✅ Migration complete! Migrated ${migrated} entries.`);
}

migrate().catch(console.error);
