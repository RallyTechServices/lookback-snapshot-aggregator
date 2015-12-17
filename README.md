#Lookback Snapshot Aggregator
This highly customized app allows a normalized data export for User Stories, Features and Initiatives from the lookback API for artifacts over a given time period.  
This app currently assumes that Features are the lowest level portfolio item type and Initiatives are the second level portfolio item type.

![ScreenShot](/images/lookback-aggregator.png)

Due to the potentially large volume of data that could be returned, the date range is limited to a max of 30 days. 
 
The app exports data within the currently selected Project Scope.  

If there are thousands of artifacts to export, performance could be slow.  

###App Configuration 
* Aggregate By
- None : Produces all snapshots for the selected time range 
- day  : Produces snapshots of object IDs at midnight for each day in the selected timezone - NOTE about TIMEZONES: 

* Artifact Type 
- User Story, Feature or Initiative


## Development Notes

Configurations for the export are in the settings.js file in a configurationMap object.  This object has key value pairs where the key is the Artifact Type (must be case sensitive for the lookback queries).
The values consist of the following attributes:

* name - Artifact Type name used for _TypeHierarchy query.  This is also used for the valueField in the App Settings ArtifactType combobox
* displayName - Display name for the App Settings dropdown box
* fetch - Fetch list passed to the SnapShot store
* hydrate - Hydrate list passed to the Snapshot Store
* fields - Fields to show in the grid.  Fields can be different than the fetch field.  If they are, then provide a field mapping for the field
* fieldMapping - function (with snapData parameter, where snapData = snapshotModel.getData()) to run to get the derived value of the field.  This is for displaying Project Name and ID when the lookback just returns a project object. if a field mapping is provided, then that function will be called, otherwise the field will be used as is from the snapshot data object. 
Example field mapping (for User Stories):
{
    "Project ID": function(snapData){
      return snapData.Project.ObjectID;
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
}
### First Load

If you've just downloaded this from github and you want to do development, 
you're going to need to have these installed:

 * node.js
 * grunt-cli
 * grunt-init
 
Since you're getting this from github, we assume you have the command line
version of git also installed.  If not, go get git.

If you have those three installed, just type this in the root directory here
to get set up to develop:

  npm install

### Structure

  * src/javascript:  All the JS files saved here will be compiled into the 
  target html file
  * src/style: All of the stylesheets saved here will be compiled into the 
  target html file
  * test/fast: Fast jasmine tests go here.  There should also be a helper 
  file that is loaded first for creating mocks and doing other shortcuts
  (fastHelper.js) **Tests should be in a file named <something>-spec.js**
  * test/slow: Slow jasmine tests go here.  There should also be a helper
  file that is loaded first for creating mocks and doing other shortcuts 
  (slowHelper.js) **Tests should be in a file named <something>-spec.js**
  * templates: This is where templates that are used to create the production
  and debug html files live.  The advantage of using these templates is that
  you can configure the behavior of the html around the JS.
  * config.json: This file contains the configuration settings necessary to
  create the debug and production html files.  Server is only used for debug,
  name, className and sdk are used for both.
  * package.json: This file lists the dependencies for grunt
  * auth.json: This file should NOT be checked in.  Create this to run the
  slow test specs.  It should look like:
    {
        "username":"you@company.com",
        "password":"secret"
    }
  
### Usage of the grunt file
####Tasks
    
##### grunt debug

Use grunt debug to create the debug html file.  You only need to run this when you have added new files to
the src directories.

##### grunt build

Use grunt build to create the production html file.  We still have to copy the html file to a panel to test.

##### grunt test-fast

Use grunt test-fast to run the Jasmine tests in the fast directory.  Typically, the tests in the fast 
directory are more pure unit tests and do not need to connect to Rally.

##### grunt test-slow

Use grunt test-slow to run the Jasmine tests in the slow directory.  Typically, the tests in the slow
directory are more like integration tests in that they require connecting to Rally and interacting with
data.
