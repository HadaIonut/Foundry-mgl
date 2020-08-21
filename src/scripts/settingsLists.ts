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
        key: "sceneGridDistance",
        data: {
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
            type: String,
            default: "m",
            scope: "world",
            config: true,
            restricted: true,
        }

    }
    ]
}