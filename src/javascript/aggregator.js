Ext.define('Rally.technicalservices.SnapshotAggregator',{

    data: undefined,
    aggregateField: "AggregateDate",
    snapAggregateField: "_ValidFrom",

    constructor: function(config){
            var snapshots = config.snapshots || [],
                aggregateBy = config.aggregateBy || null,
                fields = config.fields || ['FormattedID'],
                startDate = config.startDate,
                endDate = config.endDate;

        this.fields = fields;
        this.data = this._aggregate(snapshots, aggregateBy, fields, startDate, endDate);
        console.log('data',this.data);
    },
    getData: function(){
        return this.data;
    },
    getStoreFields: function(){
        var fields = [this.aggregateField];
        fields = fields.concat(this.fields);
        console.log('fields', fields)
        return fields;
    },
    _aggregate: function(snapshots, aggregateBy, fields, startDate, endDate){
        console.log('_aggregate',aggregateBy, fields, startDate, endDate);
        if (!aggregateBy){
            return this._rawData(snapshots, fields);
        }

        if (aggregateBy === 'day'){
            return this._aggregateByDay(snapshots, fields,startDate, endDate);
        }

        return [];
    },
    _rawData: function(snapshots, fields){
        var data = [],
            aggregateField = this.aggregateField;

        _.each(snapshots, function(s){
            var r = this._getSnapRow(s.getData(),fields)
            r[aggregateField] = Rally.util.DateTime.fromIsoString(s.get("_ValidFrom"));
            data.push(r);
        }, this);
        return data;
    },
    _getSnapRow: function(snapData, fields){
        var r = {};
        _.each(fields, function(f){
            r[f] = snapData[f] || '';
        });
        return r;
    },
    _aggregateByDay: function(snapshots, fields, startDate, endDate){
        var newDateField = "date_changed",
            snapsByOid = this._aggregateSnapsByOid(snapshots, newDateField),
            dateBuckets = this._getDateBuckets(startDate, endDate, 'day'),
            aggregateField = this.aggregateField,
            data = [];

        console.log('dateBuckets',dateBuckets);

        _.each(dateBuckets, function(day){
            _.each(snapsByOid, function(snaps){
                var objectDayRow = {};
                _.each(snaps, function(snap){
                    if (snap[newDateField] < day){
                        objectDayRow = this._getSnapRow(snap,fields);
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

        var date = bucketStartDate;

        var buckets = [];
        while (date<bucketEndDate && bucketStartDate < bucketEndDate){
            buckets.push(date);
            date = Rally.util.DateTime.add(date,granularity,1);
        }
        return buckets;
    },
    //formatDateBuckets: function(buckets, dateFormat){
    //    var categories = [];
    //    Ext.each(buckets, function(bucket){
    //        categories.push(Rally.util.DateTime.format(bucket,dateFormat));
    //    });
    //    categories[categories.length-1] += "*";
    //    return categories;
    //}


});
