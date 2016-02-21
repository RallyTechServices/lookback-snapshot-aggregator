Ext.define('Rally.technicalServices.LookbackSnapshotAggregatorSettings',{
    singleton: true,

    /**
     * Hardcoded types and fields for the configuration options
     */
    configurationMap: {
        HierarchicalRequirement: {
            name: 'HierarchicalRequirement',
            displayName: 'User Story',
            fetch: ['Feature','PortfolioItem','ObjectID','FormattedID','Name','Project','PlanEstimate','ScheduleState'],
            fields: ['Feature Object Id','Story Object Id','Story Formatted Id','Story Name','Team Object Id','Team Name','Story Point','Story State'],
            hydrate: ['ScheduleState','Project'],
            fieldMapping: {
                "Feature Object Id": function(snapData){
                    if (snapData.Feature){
                        return snapData.Feature;
                    }
                    if (snapData.PortfolioItem){
                        return snapData.PortfolioItem;
                    }
                    return "";
                },
                "Story Object Id": function(snapData) {
                    return snapData.ObjectID;
                },
                "Story Formatted Id": function(snapData) {
                    return snapData.FormattedID;
                },
                "Story Name": function(snapData) {
                    return snapData.Name;
                },
                "Team Object Id": function(snapData){
                    return snapData.Project.ObjectID;
                },
                "Team Name": function(snapData){
                    return snapData.Project.Name;
                },
                "Story Point": function(snapData){
                    return snapData.PlanEstimate;
                },
                "Story State": function(snapData){
                    return snapData.ScheduleState;
                }
            },
            find: {DirectChildrenCount: 0}
        },
        "PortfolioItem/Feature": {
            name: 'PortfolioItem/Feature',
            displayName: 'Feature',
             fetch: ['ObjectID','FormattedID','Name','Parent','PreliminaryEstimate','Project','State'],
            fields: ['Feature Object Id','Feature Formatted Id','Feature Name','Initiative Object Id','Preliminary Estimate Value','Preliminary Estimate Name','Team Object Id','Team Name','State'],
            fieldMapping: {
                "Feature Object Id": function(snapData) {
                    return snapData.ObjectID;
                },
                "Feature Formatted Id": function(snapData) {
                    return snapData.FormattedID;
                },
                "Feature Name": function(snapData) {
                    return snapData.Name;
                },
                "Initiative Object Id": function(snapData) {
                   return snapData.Parent || "";
                },
                "Preliminary Estimate Value": function(snapData) {
                     if (snapData.PreliminaryEstimate){
                        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate] &&
                            Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate].Value || "";
                    }
                   return "";
                },
                "Preliminary Estimate Name": function(snapData) {
                     if (snapData.PreliminaryEstimate){
                        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate] &&
                            Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate].Name || "";
                    }
                    return "";
                },
                "Team Object Id": function(snapData){
                    return snapData.Project.ObjectID;
                },
                "Team Name": function(snapData){
                    return snapData.Project.Name;
                }
            },
            hydrate: ['Project','State']
        },
        "PortfolioItem/Initiative": {
            name: 'PortfolioItem/Initiative',
            displayName: 'Initiative',
            fetch: ['ObjectID','FormattedID','Name','PreliminaryEstimate','Project','InvestmentCategory','State'],
            fields: ['Initiative Object Id','Initiative Formatted Id','Initiative Name','Preliminary Estimate Value','Preliminary Estimate Name','Team Object Id','Team Name','Investment Category','State'],
            fieldMapping: {
                "Initiative Object Id": function (snapData) {
                    return snapData.ObjectID;
                },
                "Initiative Formatted Id": function (snapData) {
                    return snapData.FormattedID;
                },
                "Initiative Name": function (snapData) {
                    return snapData.Name;
                },
                "Preliminary Estimate Value": function(snapData) {
                    if (snapData.PreliminaryEstimate){
                        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate] &&
                            Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate].Value || "";
                    }
                    return "";
                },
                "Preliminary Estimate Name": function(snapData) {
                    if (snapData.PreliminaryEstimate){
                        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate] &&
                            Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap[snapData.PreliminaryEstimate].Name || "";
                    }
                    return "";
                },
                "Team Object Id": function (snapData) {
                    return snapData.Project.ObjectID;
                },
                "Team Name": function (snapData) {
                    return snapData.Project.Name;
                },
                "Investment Category": function (snapData) {
                    return snapData.InvestmentCategory;
                }
            },
            hydrate: ['Project','State']
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
