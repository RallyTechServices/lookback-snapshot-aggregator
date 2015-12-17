Ext.define("Rally.technicalServices.LookbackSnapshotAggregator", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },

    items: [
        {xtype:'container',itemId:'selector_box',layout: {type: 'hbox'}},
        {xtype:'container',itemId:'display_box'}
    ],

    config: {
        defaultSettings: {
            aggregateBy: 'day',
            artifactType: 'hierarchicalrequirement',
            maxDayRange: 30,
            defaultDayRange: 7
        }
    },

    launch: function() {
        this._addDateSelectors();
    },
    fetchSnapshots: function(){
        var startDate = this.getStartDate(),
            endDate = this.getEndDate();
        //Validate
        this.down('#display_box').removeAll();
        if (!this._validateDateRange(startDate, endDate)){
            return;
        }

        this.logger.log('fetchSnapshots', startDate, endDate, this.getArtifactType());
        this.setLoading(true);
        var asf = Ext.create('Rally.technicalservices.AggregateStoreFactory',{
            find: {
                _ProjectHierarchy: {$in: [this.getContext().getProject().ObjectID]},
                _TypeHierarchy: {$in: [this.getArtifactType()]},
                _ValidFrom: {$lte: Rally.util.DateTime.toIsoString(endDate)},
                _ValidTo: {$gt: Rally.util.DateTime.toIsoString(startDate)}
            },
            fetch: this.getFetchFields(),
            hydrate: this.getHydrateFields(),
            limit: 'Infinity',
            startDate: startDate,
            endDate: endDate,
            aggregateBy: this.getAggregateBy(),
            sort: {
                _ValidFrom: 1
            }
        });

        asf.load();
        asf.on('storeready',this._addGrid, this);
        asf.on('error',this._showErrorMessage, this);
    },
    _validateDateRange: function(startDate, endDate){
        if (!startDate || !endDate){
            this.down('#display_box').add({
                xtype: 'container',
                html: 'Please Select a valid Start Date and End Date'
            });
            return false;
        }

        var delta =Rally.util.DateTime.getDifference(endDate,startDate,  'day');
        this.logger.log('_validateDateRange', startDate, endDate, delta);
        if (delta < 0){
            this.down('#display_box').add({
                xtype: 'container',
                html: 'Please Select a Start Date that falls before the End Date'
            });
            return false;
        }
        if (delta > this.getMaxDayRange()){
            this.down('#display_box').add({
                xtype: 'container',
                html: 'Date range too large.  Please Select a date range of ' + this.getMaxDayRange() + " days or less."
            });
            return false;
        }
        return true;
    },
    _showErrorMessage: function(msg){
        this.logger.log('_showError', msg);
        this.setLoading(false);
        Rally.ui.notify.Notifier.showError({message: msg});
    },
    _addGrid: function(data, fields){
        this.logger.log('_addGrid', data, fields);
        this.setLoading(false);
        if (this.down('rallygrid')){
            this.down('rallygrid').destroy();  
        }

        var store = Ext.create('Rally.data.custom.Store', {
            data: data,
            fields: fields
        });

        this.down('#display_box').add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: this._getColumns(fields)
        });
    },
    _getColumns: function(fields){
        return _.map(fields, function(f){ return {text: f, dataIndex: f, flex: 1 }; });
    },
    getFetchFields: function(){
        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.configurationMap[this.getArtifactType()].fetch;
    },
    getHydrateFields: function(){
        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.configurationMap[this.getArtifactType()].hydrate;
    },
    getArtifactType: function(){
        return this.getSetting('artifactType');
    },
    getAggregateBy: function(){
        return this.getSetting('aggregateBy');
    },
    getMaxDayRange: function(){
        return this.getSetting('maxDayRange');
    },
    getDefaultDayRange: function(){
        return this.getSetting('defaultDayRange');
    },
    _addDateSelectors: function(){
        var today = new Date();

        this.getSelectorBox().add(this.getDateSelectorConfig('dt-startDate','Start Date',Rally.util.DateTime.add(today,"day",-this.getDefaultDayRange())));
        this.getSelectorBox().add(this.getDateSelectorConfig('dt-endDate','End Date',today));
        var btn = this.getSelectorBox().add({
            xtype: 'rallybutton',
            text: 'Update'
        });
        btn.on('click', this.fetchSnapshots, this);
    },
    getDateSelectorConfig: function(itemId, label,defaultValue){
        return {
            xtype: 'rallydatefield',
            itemId: itemId,
            fieldLabel: label,
            labelAlign: 'right',
            value: defaultValue
        };
    },
    getSelectorBox: function(){
        return this.down('#selector_box');
    },
    getStartDate: function(){
        return this.getSelectorBox().down('#dt-startDate').getValue();
    },
    getEndDate: function(){
        return this.getSelectorBox().down('#dt-endDate').getValue();
    },
    getSettingsFields: function(){
        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.getFields();
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this.launch();
    }
});
