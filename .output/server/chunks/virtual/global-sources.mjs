const sources = [
    {
        "context": {
            "name": "nuxt:pages",
            "description": "Generated from your static page files.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:pages'] }`."
            ]
        },
        "urls": [
            {
                "loc": "/admin/login"
            },
            {
                "loc": "/admin/noticias"
            },
            {
                "loc": "/admin/procedimientos"
            },
            {
                "loc": "/admin"
            },
            {
                "loc": "/noticias"
            },
            {
                "loc": "/procedimientos"
            },
            {
                "loc": "/simulador"
            }
        ],
        "sourceType": "app"
    },
    {
        "context": {
            "name": "nuxt:route-rules",
            "description": "Generated from your route rules config.",
            "tips": [
                "Can be disabled with `{ excludeAppSources: ['nuxt:route-rules'] }`."
            ]
        },
        "urls": [
            "/",
            "/nosotros",
            "/simulador",
            "/recursos"
        ],
        "sourceType": "app"
    }
];

export { sources };
//# sourceMappingURL=global-sources.mjs.map
