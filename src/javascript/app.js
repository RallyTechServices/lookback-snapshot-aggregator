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
            artifactType: 'HierarchicalRequirement',
            maxDayRange: 30,
            defaultDayRange: 7
        }
    },

    launch: function() {
         //initialize the preliminary estimate field mapping
        Ext.create('Rally.data.wsapi.Store',{
            model:'PreliminaryEstimate',
            fetch: true
        }).load({
            callback: function(records){
                this.logger.log('PreliminaryEstimate Hydration', records);
                var oidValueHash = {};
                _.each(records, function(r){
                    oidValueHash[r.get('ObjectID')] = {};
                    oidValueHash[r.get('ObjectID')].Value = r.get('Value');
                    oidValueHash[r.get('ObjectID')].Name = r.get('Name');
                });
                Rally.technicalServices.LookbackSnapshotAggregatorSettings.preliminaryEstimateMap = oidValueHash;
                //Rally.technicalServices.LookbackSnapshotAggregatorSettings.configurationMap["PortfolioItem/Initiative"].fieldMapping.PreliminaryEstimate = function(snapData){
                //    return oidValueHash[snapData.PreliminaryEstimate].Name || "";
                //};
                //Rally.technicalServices.LookbackSnapshotAggregatorSettings.configurationMap["PortfolioItem/Feature"].fieldMapping.PreliminaryEstimate = function(snapData){
                //    return oidValueHash[snapData.PreliminaryEstimate].Name || "";
                //};
                this._addDateSelectors();
            },
            scope: this
        });


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

        var find = {
            _ProjectHierarchy: {$in: [this.getContext().getProject().ObjectID]},
            _TypeHierarchy: this.getArtifactType(),
            _ValidFrom: {$lt: Rally.util.DateTime.toIsoString(endDate)},
            _ValidTo: {$gte: Rally.util.DateTime.toIsoString(startDate)}
        };
        if (this.getConfigurationMap().find){
            Ext.Object.merge(find,this.getConfigurationMap().find);
        }

        this.logger.log('find', find,this.getArtifactType() );

        this.setLoading(true);
        var asf = Ext.create('Rally.technicalservices.AggregateStoreFactory',{
            find: find,
            fetch: this.getFetchFields(),
            configurationMap: this.getConfigurationMap(),
            hydrate: this.getHydrateFields(),
            limit: 'Infinity',
            startDate: startDate,
            endDate: endDate,
            aggregateBy: this.getAggregateBy(),
            sort: {
                _ValidFrom: 1
            },
            removeUnauthorizedSnapshots: true
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

        this.down('#btn-export').setDisabled(false);

        var store = Ext.create('Rally.data.custom.Store', {
            data: data,
            fields: fields
        });

        this.down('#display_box').add({
            xtype: 'rallygrid',
            showRowActionsColumn: false,
            store: store,
            columnCfgs: this._getColumns(fields)
        });
    },
    _getColumns: function(fields){
        return _.map(fields, function(f){
            var col = {text: f, dataIndex: f, flex: 1 };
            if (f === "Day"){
                col.renderer = function(v){
                    return Rally.util.DateTime.toIsoString(v);
                }
            }
            return col;
        });
    },
    getFetchFields: function(){
        this.logger.log('getFetchFields',this.getArtifactType());
        return this.getConfigurationMap().fetch;
    },
    getConfigurationMap: function(){
        return Rally.technicalServices.LookbackSnapshotAggregatorSettings.configurationMap[this.getArtifactType()];
    },
    getHydrateFields: function(){
        return this.getConfigurationMap().hydrate;
    },
    getArtifactType: function(){
        return this.down('#artifactType').getValue();
        //return this.getSetting('artifactType');
    },
    getAggregateBy: function(){
        return this.down('#aggregateBy').getValue();
        //return this.getSetting('aggregateBy');
    },
    getMaxDayRange: function(){
        return this.getSetting('maxDayRange');
    },
    getDefaultDayRange: function(){
        return this.getSetting('defaultDayRange');
    },
    _addDateSelectors: function(){
        this.down('#selector_box').removeAll();
        this.down('#display_box').removeAll();

        var configurationData = _.values(Rally.technicalServices.LookbackSnapshotAggregatorSettings.configurationMap),
            width = 100;

        this.getSelectorBox().add({
            xtype: 'rallycombobox',
            itemId: 'artifactType',
            store: Ext.create('Ext.data.Store', {data: configurationData, fields: ['name','displayName']}),
            fieldLabel: "Artifact Type",
            labelAlign: 'right',
            labelWidth: width,
            displayField: 'displayName',
            valueField: 'name'
        });

        this.getSelectorBox().add({
            xtype: 'rallycombobox',
            itemId: 'aggregateBy',
            store: Ext.create('Ext.data.Store',{data: Rally.technicalServices.LookbackSnapshotAggregatorSettings.aggregateByOptions, fields: ['name','value']}),
            displayField: 'name',
            valueField: 'value',
            labelAlign: 'right',
            labelWidth: width,
            fieldLabel: "Aggregate By"
        });


        var today = new Date();

      //  this.getSelectorBox().add(this.getDateSelectorConfig('gDate','Start Date',Rally.util.DateTime.add(today,"day",-this.getDefaultDayRange())));
        this.getSelectorBox().add(this.getDateSelectorConfig('dt-endDate','Day',today));
        var btn = this.getSelectorBox().add({
            xtype: 'rallybutton',
            text: 'Update',
            margin: '0 10 0 10'
        });
        btn.on('click', this.fetchSnapshots, this);

        var btn = this.getSelectorBox().add({
            xtype: 'rallybutton',
            itemId: 'btn-export',
            text: 'Export',
            margin: '0 10 0 10',
            disabled: true
        });
        btn.on('click', this.export, this);

    },
    export: function(){
        this.logger.log('export');
        Rally.technicalservices.FileUtilities.getCSVFromGrid(this.down('rallygrid')).then({
            success: function(csv){
                this.logger.log('csv',csv);
                Rally.technicalservices.FileUtilities.saveCSVToFile(csv, "export.csv");
            },
            scope: this
        });

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
        var day = this.getSelectorBox().down('#dt-endDate').getValue();
        day.setHours(0,0,0,0);
        return day; //beginning of day
    },
    getEndDate: function(){
        this.logger.log('getEndDate', this.getStartDate());
        return Rally.util.DateTime.add(this.getStartDate(), "day", 1);
    },
    getSettingsFields: function(){
        return [];  //Rally.technicalServices.LookbackSnapshotAggregatorSettings.getFields();
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
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this._addDateSelectors();
    }
});
