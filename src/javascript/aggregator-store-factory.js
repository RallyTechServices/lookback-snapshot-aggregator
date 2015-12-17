Ext.define('Rally.technicalservices.AggregateStoreFactory',{
    extend: 'Rally.data.lookback.SnapshotStore',

    logger: new Rally.technicalservices.Logger(),
    snapshots: null,

    startDate: null,
    endDate: null,
    aggregateBy: null,

    constructor: function(config){
        this.logger.log('constructor',config);
        this.startDate = config.startDate;
        this.endDate = config.endDate;
        this.aggregateBy = config.aggregateBy || null;
        this.configurationMap = config.configurationMap;

        config.sort = { _ValidFrom: 1 };  //The aggregator class needs snapshots to be sorted ascending in order.
        this.callParent([config]);

        this.on('load', this._aggregateSnapshots, this);
    },

    _aggregateSnapshots: function(store, snapshots, success){
        this.snapshots = snapshots;

        this.logger.log('_aggregateSnapshots',this.aggregateBy, this.fetch, snapshots, success);
        if (success){
            var aggregator = Ext.create('Rally.technicalservices.SnapshotAggregator',{
                snapshots: this.snapshots,
                aggregateBy: this.aggregateBy,
                startDate: this.startDate,
                endDate: this.endDate,
                configurationMap: this.configurationMap
            });

            this.fireEvent('storeready', aggregator.getData(), aggregator.getStoreFields());
        } else {
            this.fireEvent('error', "Error loading snapshots.");
        }
    }
});
