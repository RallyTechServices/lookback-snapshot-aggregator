Ext.define('Rally.technicalServices.LookbackSnapshotAggregatorSettings',{
    singleton: true,

    /**
     * Hardcoded types and fields for the configuration options
     */
    configurationMap: {
        hierarchicalrequirement: {
            name: 'hierarchicalRequirement',
            displayName: 'User Story',
            fetch: ['ObjectID','FormattedID','Name','PlanEstimate','ScheduleState','Project','Parent','PortfolioItem'],
            hydrate: ['ScheduleState','Project'],
            manualHydrate: []
        },
        "portfolioitem/feature": {
            name: 'portfolioitem/feature',
            displayName: 'Feature',
            fetch: ['ObjectID','FormattedID','Name','State','Project','Parent'],
            hydrate: ['State','Project'],
            manualHydrate: []
        },
        //Date    Initiative ID    Initiative Name    Team    Team ID    Cap / Exp Field    Investment Category    Initiative Size    State
        "portfolioitem/initiative": {
            name: 'portfolioitem/initiative',
            displayName: 'Initiative',
            fetch: ['ObjectID','FormattedID','Name','Project','Project','Investment Category','State','Parent','PreliminaryEstimate'],
            hydrate: ['State','Project'],
            manualHydrate: []
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
