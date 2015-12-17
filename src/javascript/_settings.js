Ext.define('Rally.technicalServices.LookbackSnapshotAggregatorSettings',{
    singleton: true,

    /**
     * Hardcoded types and fields for the configuration options
     */
    configurationMap: {
        HierarchicalRequirement: {
            name: 'HierarchicalRequirement',
            displayName: 'User Story',
            fetch: ['ObjectID','FormattedID','Name','PlanEstimate','ScheduleState','Project','Feature','PortfolioItem'],
            hydrate: ['ScheduleState','Project'],
            fields: ['ObjectID','FormattedID','Name','PlanEstimate','ScheduleState','Project ID','Project Name','Feature ID'],
            fieldMapping: {
                "Project ID": function(snapData){
                    return snapData.Project.ObjectID;
                },
                "Project Name": function(snapData){
                    return snapData.Project.Name;
                },
                "Feature ID": function(snapData){
                    if (snapData.Feature){
                        return snapData.Feature.ObjectID;
                    }
                    if (snapData.PortfolioItem){
                        return snapData.PortfolioItem.ObjectID;
                    }
                    return "";
                }
            },
            find: {DirectChildrenCount: 0}
        },
        "PortfolioItem/Feature": {
            name: 'PortfolioItem/Feature',
            displayName: 'Feature',
            fetch: ['ObjectID','FormattedID','Name','State','Project','Parent'],
            fields: ['ObjectID','FormattedID','Name','State','Project ID','Project Name','Initiative ID'],
            fieldMapping: {
                "Project ID": function(snapData){
                    return snapData.Project.ObjectID;
                },
                "Project Name": function(snapData){
                    return snapData.Project.Name;
                },
                "Initiative ID": function(snapData){
                    if (snapData.Parent){
                        return snapData.Parent.ObjectID;
                    }
                    return "";
                }
            },
            hydrate: ['State','Project']
        },
        //Date    Initiative ID    Initiative Name    Team    Team ID    Cap / Exp Field    Investment Category    Initiative Size    State
        "PortfolioItem/Initiative": {
            name: 'PortfolioItem/Initiative',
            displayName: 'Initiative',
            fetch: ['ObjectID','FormattedID','Name','Project','Investment Category','State','Parent','PreliminaryEstimate'],
            fields: ['ObjectID','FormattedID','Name','Project ID','Project Name','Investment Category','State','PreliminaryEstimate'],
            fieldMapping: {
                "Project ID": function (snapData) {
                    return snapData.Project.ObjectID;
                },
                "Project Name": function (snapData) {
                    return snapData.Project.Name;
                },
                "PreliminaryEstimate": function (snapData) {
                    //TODO: populate Preliminary Estimate with Value
                    return snapData.PreliminaryEstimate;
                }
            },
            hydrate: ['State','Project']
        }
    },

    aggregateByOptions: [{
        name: 'Day',
        value: 'day'
    },{
        name: 'None',
        value: 'none'
    }],

    getFields: function(){
        var configurationData = _.values(this.configurationMap),
            width = 100;

        return [{
            xtype: 'rallycombobox',
            name: 'aggregateBy',
            store: Ext.create('Ext.data.Store',{data: this.aggregateByOptions, fields: ['name','value']}),
            displayField: 'name',
            valueField: 'value',
            labelAlign: 'right',
            labelWidth: width,
            fieldLabel: "Aggregate By"
        },{
            xtype: 'rallycombobox',
            name: 'artifactType',
            store: Ext.create('Ext.data.Store', {data: configurationData, fields: ['name','displayName']}),
            fieldLabel: "Artifact Type",
            labelAlign: 'right',
            labelWidth: width,
            displayField: 'displayName',
            valueField: 'name'
        }];
    }
});
