export default {
    SETTINGS: [
    {
        key: "conversionMultipliers",
        data: {
            type: String,
            default: "{inch: 2.5,feet: 0.3,mile: 1.6,pound: 0.5}",
            scope: "world",
            config: false,
            restricted: true,
        },
    },
    {
        key: "sceneConversion",
        data: {
            name: "Enable scene conversion: ",
            hint: "This setting allows automatic conversion of scene settings.",
            type: Boolean,
            default: true,
            scope: "world",
            config: true,
            restricted: true,
        }
    },
    {
        key: "sceneGridDistance",
        data: {
            name: "Scene grid distance: ",
            hint: "Converted size for a single square.",
            type: Number,
            default: 1.5,
            scope: "world",
            config: true,
            restricted: true,
        }

    },
    {
        key: "sceneGridUnits",
        data: {
            name: "Scene grid units: ",
            type: String,
            default: "m",
            scope: "world",
            config: true,
            restricted: true,
        }

    },
    ]
}