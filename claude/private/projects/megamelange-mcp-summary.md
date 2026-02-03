# MegaMelange MCP POC Project Summary

## Overview

| Field | Value |
|-------|-------|
| **Project** | MegaMelange (Unreal MCP) |
| **Period** | August 27 - September 26, 2025 (~1 month) |
| **Branch** | `art/feature/mcp-1.0.0-r8` → `art/feature/mcp-1.1.0-r3` |
| **Owner** | Deemo |
| **Documentation** | `MegaMelange/README_HowToStart_Korean.md` |

## Purpose & Target

- **Core Goal**: Implement Studio UX for controlling Unreal Engine via natural language (chatbot)
- **Target Users**: Creative professionals in their 20s (Directors, Cinematographers, Technical Artists)
- **Use Cases**: Film, game development, virtual production

## Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| Python | NLP module, command handlers |
| C++ | Unreal Engine API integration (UnrealMCPRenderingCommands.cpp) |
| TCP | Unreal ↔ Server communication |

### Frontend

| Technology | Purpose |
|------------|---------|
| React | WebUI frontend |
| TypeScript | index.ts etc. |

### AI/ML

| Technology | Purpose |
|------------|---------|
| Gemini | Internal LLM (initial) |
| nano-banana | Image generation AI |
| Veo3 | Video generation AI (added September) |

### Infrastructure (Planned)

| Technology | Purpose |
|------------|---------|
| Supabase | Database |
| Docker | Hosting environment isolation |

## Implemented Features

### 1. NLP Natural Language Processing Module
- Natural language → Unreal command conversion
- Decision Tree: 2D mode / 3D mode separation
- Context retention (conversation history-based)
- Token optimization: 2000+ → 800~1150 (~50% reduction)

### 2. Modular Command Handlers (`actor_command_handlers/`)

| Module | Function |
|--------|----------|
| `actor.py` | Actor-related features |
| `cesium.py` | Cesium geospatial features |
| `light.py` | Lighting control |
| `uds.py` | Ultra Dynamic Sky control |
| `udw.py` | Ultra Dynamic Weather control |
| `materials.py` | Material parameter adjustment |
| `camera.py` | Camera position/FOV/focus control |

### 3. Screenshot Workflow
- High-resolution capture support
- Viewport (camera) screenshots
- Project path configuration in `.env` required

### 4. Weather Control System
- `get_ultra_dynamic_weather`
- `set_current_weather_to_rain`
- Natural language examples: "Make it rain", "What's the weather?", "Start a storm"

### 5. Material Control
- `set_material_parameter`: Scalar/vector/texture parameter adjustment
- `apply_material_to_actor`: Apply material to specific actor
- `create_material_instance`: Dynamic material instance creation

### 6. Camera Control
- `set_camera_position`: Position camera by location/rotation
- `set_camera_fov`: Field of view adjustment (10~170 degrees)
- `focus_camera_on_actor`: Auto-focus on specific object
- `set_viewport_size`: Capture resolution setting

### 7. External Platform Integration (September)

| Platform | Status |
|----------|--------|
| VRM | Hooking complete |
| Roblox | API communication handler integrated (OBJ download → FBX conversion) |
| Zepeto | Planned |

### 8. Image Reference Feature
- Reference image attachment → Analysis via image evaluator
- Prompt matching per reference
- Unique identifier assignment flow

## Timeline

| Date | Milestone |
|------|-----------|
| 8/27 | mcp-1.0.0-r8 major refactoring (+964, -464 lines) |
| 8/28 | nlp.py refactoring, todo cleanup |
| 9/01 | Context retention feature complete |
| 9/03 | Weather control system, material/camera handlers ready |
| 9/08 | Screenshot workflow added, nano-banana integration success |
| 9/09 | NLP 2D/3D mode separation, token optimization |
| 9/11 | Screenshot logic separation, available for team use |
| 9/19 | Veo3 integration, LLM vision feature (camera actor position detection) |
| 9/22 | Korean README written, veo3 testing |
| 9/24 | Product team handoff discussion (Jay) |
| 9/26 | Roblox API handler integration, image reference feature |

## Usage

### Environment Setup
```bash
# python/.env
UNREAL_PROJECT_PATH=E:\CINEVStudio\CINEVStudio
```

### Execution
1. Run `CINEVStudio\MegaMelange\script-init-ports.bat` → Enter
2. Restart engine with F5 in Visual Studio
3. Open LV_MM map

### Usage Examples
- "Set up San Francisco" → Cesium coordinate setting
- "Make it rain" → Weather change
- "Rotate the character 45 degrees clockwise" → Actor rotation

## Future Roadmap

1. **DB Integration**: Context persistence with Supabase
2. **LLM Model Switcher**: Sonnet, GPT, Gemini selectable
3. **Docker Containerization**: Hosting environment isolation
4. **Asset Natural Language Control**: VRM/Zepeto/Roblox user freedom features priority

## References

### Branch/Map

| Field | Value |
|-------|-------|
| Branch | `art/feature/mcp-1.1.0-r3` |
| Map | `LV_MM` |
| Character | `BP_AnimeCharacter_EnvCheck` |
| GitHub | https://github.com/CINEV/MCP (Motion Conversion Pipeline - separate project) |
