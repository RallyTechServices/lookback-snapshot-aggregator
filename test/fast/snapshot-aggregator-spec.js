

describe("Example test set", function() {

    var snapshots =[];
    snapshots.push(Ext.create('mockSnapshot',{ _ValidFrom: '2015-07-02T13:26:19.00Z', ObjectID: 1, Name: 'Object1', PlanEstimate: 3, ScheduleState: 'Defined'}));
    snapshots.push(Ext.create('mockSnapshot',{ _ValidFrom: '2015-07-06T09:43:01.000Z', ObjectID: 1, Name: 'Object1', PlanEstimate: 3, ScheduleState: 'Defined'}));
    snapshots.push(Ext.create('mockSnapshot',{ _ValidFrom: '2015-07-08T23:59:26.000Z', ObjectID: 1, Name: 'Object1', PlanEstimate: 3, ScheduleState: 'Defined'}));
    snapshots.push(Ext.create('mockSnapshot',{ _ValidFrom: '2015-07-12T00:26:14.000Z', ObjectID: 1, Name: 'Object1', PlanEstimate: 3, ScheduleState: 'Defined'}));

    var ag = new Rally.technicalservices.SnapshotAggregator({
        snapshots: snapshots,
        fields: ['FormattedID','Name','ObjectID']
    });
    console.log('start');

   var data = ag.getData();

   // _ValidTo: "9999-01-01T00:00:00.000Z"
    it("should return a raw data array if no granularity is specified",function(){
        expect(data.length).toBe(snapshots.length);
    });

    it ("should create the date field by which to aggregate", function(){
       expect(_.has(data[0], "Date")).toBe(true);
    });

    it ("should sort data ascending by default", function(){
        var idx = 0;
        _.each(data, function(d){
            expect(d.Date).toBe(Rally.util.DateTime.fromIsoString(snapshots[idx++].get('_ValidFrom')));
        });
    });



});