Ext.define('Rally.technicalservices.SnapshotAggregator',{

    data: undefined,
    aggregateField: "Day",
    snapAggregateField: "_ValidFrom",

    constructor: function(config){
            var snapshots = config.snapshots || [],
                aggregateBy = config.aggregateBy || null,
                startDate = config.startDate,
                endDate = config.endDate;

        this.configurationMap = config.configurationMap;

        this.data = this._aggregate(snapshots, aggregateBy, startDate, endDate);
    },
    getData: function(){
        return this.data;
    },
    getStoreFields: function(){
        var fields = [this.aggregateField];
        fields = fields.concat(this.configurationMap.fields);
        return fields;
    },
    _aggregate: function(snapshots, aggregateBy, startDate, endDate){
        if (aggregateBy === 'none'){
            return this._rawData(snapshots);
        }

        if (aggregateBy === 'day'){
            return this._aggregateByDay(snapshots,startDate, endDate);
        }

        return [];
    },
    _rawData: function(snapshots){
        var data = [],
            aggregateField = this.aggregateField;

        _.each(snapshots, function(s){
            var r = this._getSnapRow(s.getData())
            r[aggregateField] = Rally.util.DateTime.fromIsoString(s.get("_ValidFrom"));
            data.push(r);
        }, this);
        return data;
    },
    _getSnapRow: function(snapData){
        var r = {},
            fields = this.configurationMap.fields,
            fieldMapping = this.configurationMap.fieldMapping;

        _.each(fields, function(f){
            if (fieldMapping[f]){
                r[f] = fieldMapping[f](snapData);
            } else {
                r[f] = snapData[f] || '';
            }
        });
        return r;
    },
    _aggregateByDay: function(snapshots, startDate, endDate){
        var newDateField = "date_changed",
            snapsByOid = this._aggregateSnapsByOid(snapshots, newDateField),
            dateBuckets = [endDate],
            //dateBuckets = this._getDateBuckets(startDate, endDate, 'day'),
            aggregateField = this.aggregateField,
            data = [];

        _.each(dateBuckets, function(day){
            _.each(snapsByOid, function(snaps){
                var objectDayRow = {};
                _.each(snaps, function(snap){
                    if (snap[newDateField] < day){
                        objectDayRow = this._getSnapRow(snap);
                        objectDayRow[aggregateField] = day;
                    }
                }, this);
                data.push(objectDayRow);
            }, this);
        }, this);
        return data;
    },
    _aggregateSnapsByOid: function(snaps, newDateField) {
        //Return a hash of objects (key=ObjectID) with all snapshots for the object
        var snaps_by_oid = {};
        Ext.each(snaps, function (snap) {
            var oid = snap.ObjectID || snap.get('ObjectID');
            if (snaps_by_oid[oid] == undefined) {
                snaps_by_oid[oid] = [];
            }
            var data = snap.getData();
            data[newDateField] = Rally.util.DateTime.fromIsoString(snap.get('_ValidFrom'));
            snaps_by_oid[oid].push(data);
        });
        return snaps_by_oid;
    },

    _getDateBuckets: function(startDate, endDate, granularity){
        //Todo: once we start adding more granularity, this will need to be updated to get a different bucket start date
        var bucketStartDate = startDate;
        var bucketEndDate = Rally.util.DateTime.add(endDate, granularity, 1);
        bucketEndDate = Rally.util.DateTime.add(bucketEndDate, "millisecond",-1);

        var date = bucketStartDate;

        var buckets = [];
        while (date<bucketEndDate && bucketStartDate < bucketEndDate){
            buckets.push(date);
            date = Rally.util.DateTime.add(date,granularity,1);
        }
        return buckets;
    }


});
