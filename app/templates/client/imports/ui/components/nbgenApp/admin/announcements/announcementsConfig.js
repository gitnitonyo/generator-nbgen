const config = {
    uiLayout: {
        listLayout: {
            initialSort: {
                dateToPost: -1,
                modifiedAt: -1,
                createdAt: -1
            },
            fields: [{
                fieldName: "title",
                leftIcon: "mdi-newspaper mdi",
                searchField: true
            }, {
                fieldName: "_public",
                value: "{{_public ? '<i class=\"mdi-check mdi\"></i>' : '<i class=\"mdi-close mdi\"></i>'}}&nbsp;Public",
            }, {
                fieldName: "dateRange",
                leftIcon: "mdi-calendar mdi",
                value: "{{dateToPost | date: 'MM/dd/yyyy'}} - {{expiryDate | date: 'MM/dd/yyyy'}}",
            }]
        },
        translatePrefix: "announcements",
        formLayout: {
            formGroups: [{
                cssClass: "form-group-border",
                fields: [{
                    fieldName: "title",
                    fieldValidateRulesRequired: true,
                    fieldValidateRulesMaxlength: 50,
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "_public",
                    fieldInputType: "checkbox",
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "dateToPost",
                    fieldInputType: "date",
                    gridClass: "col-sm-6"
                }, {
                    fieldName: "expiryDate",
                    fieldInputType: "date",
                    gridClass: "col-sm-6",
                }, {
                    fieldName: "content",
                    fieldInputType: "textarea",
                    inputCssClass: "md-caption",
                    inputCssStyle: {
                        "line-height": "14px",
                        "font-family": "monospace",
                    },
                    fieldRowSize: "20"
                }]
            }]
        }
    }
}

export default config
