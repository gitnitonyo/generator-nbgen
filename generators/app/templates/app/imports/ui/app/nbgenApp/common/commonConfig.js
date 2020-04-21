const config = {
    countriesListLayout: {
        initialSort: { "name": 1 },
        displayAvatar: false,
        fields: [{
            fieldName: "name",
            searchField: true,
        }, {
            fieldName: "_id",
            searchField: true,
        }]
    },
    countriesChipTemplate: function(chip) {
        return `${chip.name} (${chip._id})`;
    },
}

export default config;
