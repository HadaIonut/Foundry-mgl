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
    }
    ]
}