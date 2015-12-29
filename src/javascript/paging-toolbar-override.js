(function() {

    var Ext = window.Ext4 || window.Ext;

    /**
     * A paging toolbar to be used with a Rally.ui.grid.Grid.
     * Displays the range of data displayed, the total count of records, and the currently selected page size.
     * It also allows you to change the page size.
     *
     * In general, this class will not be created directly but instead will be instantiated by Rally.ui.grid.Grid
     * as specified by its pagingToolbarCfg:
     *
     *     pagingToolbarCfg: {
     *        pageSizes: [5, 10, 25]
     *     }
     */
    Ext.define('Rally.ui.grid.PagingToolbar', {
        requires: [
            'Ext.XTemplate',
            'Ext.data.StoreManager',
            'Rally.ui.combobox.ComboBox',
            'Rally.ui.Button'
        ],
        extend : 'Ext.Component',
        alias : 'widget.rallypagingtoolbar',

        mixins: {
            clientMetrics: 'Rally.clientmetrics.ClientMetricsRecordable'
        },

        clientMetrics: [
            {
                method: 'movePrevious',
                description: 'page change to previous'
            },
            {
                method: 'moveNext',
                description: 'page change to next'
            }
        ],

        /**
         * @property {Boolean} border True to show border
         */
        border: false,

        /**
         * @cfg {String} cls A CSS class that will be added to the toolbar's element
         */
        cls: 'grid-pager',

        config : {
            /**
             * @cfg {Ext.data.Store} store (required)
             * store the pager should use as its data source
             */
            store: undefined,

            /**
             * @cfg {Array}
             * valid page sizes
             */
            pageSizes: [25, 50, 100, 200],

            /**
             * @cfg {Object}
             * Config passed to the pagesize combobox
             */
            comboboxConfig: {}
        },

        renderSelectors : {
            firstEl : '.nav-links .rly-first',
            prevEl : '.rly-prev',
            nextEl : '.rly-next',
            lastEl : '.rly-last',
            pageSizeEl : '.page-size-links'
        },

        renderTpl : new Ext.XTemplate(
            '<tpl if="pageSizes.length &gt; 1">',
            '<div class="page-size-links">',
            '<div class="page-size-label">SHOW</div>',
            '<div class="page-size-combobox-container"></div>',
            '</div>',
            '</tpl>',
            '<div class="nav-links">',
            '<span class="rly-first"></span> ',
            '<span class="rly-prev"></span> ',
            '<span class="range">',
            '{start}-{end}',
            '<tpl if="total &gt; 0">',
            ' of {total}',
            '</tpl>',
            '</span> ',
            '<span class="rly-next"></span> ',
            '<span class="rly-last"></span> ',
            '</div>'
        ),

        constructor: function(config) {
            this.callParent(arguments);

            this.addEvents(
                /**
                 * @event
                 * Fires after the active page has been changed.
                 * @param {Rally.ui.grid.PagingToolbar} this
                 * @param {Object} pageData An object that has these properties:
                 * @param {Number} pageData.total The total number of records in the dataset as returned by the server
                 * @param {Number} pageData.currentPage The current page number
                 * @param {Number} pageData.pageCount The total number of pages
                 * @param {Number} pageData.start The starting record index for the current page
                 * @param {Number} pageData.end The ending record index for the current page
                 * @param {Number} pageData.pageSize The current page size
                 */
                'change',

                /**
                 * @event
                 * Fires just before the active page is changed. Return false to prevent the active page from being changed.
                 * @param {Rally.ui.grid.PagingToolbar} this
                 * @param {Number} page The page number that will be loaded on change
                 */
                'beforechange'
            );
        },

        initComponent: function() {
            this.callParent();
            this.on('beforerender', this._onBeforeRender, this);
            this.bindStore(this.store);
        },

        /**
         * @private
         */
        onRender: function() {
            this.callParent(arguments);
            this._reRender();
            this.el.dom.tabIndex = 0;
        },

        /**
         * @private
         */
        onDestroy: function() {
            this._cleanupAdditionalComponents();
            this.callParent(arguments);
        },

        _addPageSizeCombobox: function() {
            if (this.pageSizeEl) {
                this.pagingComboBox = Ext.create('Rally.ui.combobox.ComboBox', Ext.apply({
                    cls: 'page-size-combobox',
                    itemId: 'pageSizeBox',
                    listeners: {
                        select: this.changePageSize,
                        scope: this
                    },
                    store: Ext.create('Ext.data.Store', {
                        fields: ['value', 'display'],
                        data: this._generatePageSizeData()
                    }),
                    queryMode: 'local',
                    displayField: 'display',
                    valueField: 'value',
                    renderTo: this.pageSizeEl.down('.page-size-combobox-container'),
                    width: 50,
                    value: this.renderData.pageSize
                }, this.comboboxConfig));
            }
        },

        _addButtons: function() {
            var disableBack = this.renderData.currentPage === 1,
                disableForward = this.renderData.currentPage >= this.renderData.pageCount;

            this.firstButton = this._addButton('firstButton', 'First', this.moveFirst, disableBack, this.firstEl);
            this.prevButton = this._addButton('prevButton', 'Prev', this.movePrevious, disableBack, this.prevEl);
            this.nextButton = this._addButton('nextButton', 'Next', this.moveNext, disableForward, this.nextEl);
            this.lastButton = this._addButton('lastButton', 'Last', this.moveLast, disableForward, this.lastEl);
        },

        _addButton: function(itemId, text, clickFn, disabled, renderEl) {

            return Ext.create('Rally.ui.Button', {
                itemId: itemId,
                text: text,
                cls: 'secondary rly-small',
                listeners: {
                    click: clickFn,
                    scope: this
                },
                disabled: disabled,
                renderTo: renderEl
            });
        },

        _cleanupAdditionalComponents: function() {
            Ext.destroy(this.pagingComboBox, this.firstButton, this.prevButton, this.nextButton, this.lastButton);
        },

        _generatePageSizeData: function(){
            return _.map(this.pageSizes, function (size) {
                return {display: size, value: size};
            });
        },

        _reRender : function() {
            if (this.rendered !== true) {
                return;
            }

            this._cleanupAdditionalComponents();

            this.renderData = this._getPageData();
            this.renderTpl.overwrite(this.getTargetEl(), this.renderData);

            this.applyRenderSelectors();
            this._addPageSizeCombobox();
            this._addButtons();

            this.fireEvent('change', this, this.renderData);
        },

        _onFirstLoad: function() {
            this._reRender();
            this.mon(this.getStore(), 'load', this._onSubsequentLoads, this);
        },

        _onSubsequentLoads: function() {
            this._reRender();
            this._recordMetricsEnd();
        },

        /**
         * Move to the previous page of data
         */
        movePrevious: function() {
            var store = this.getStore(),
                prev = store.currentPage - 1;

            if (prev > 0) {
                if (this.fireEvent('beforechange', this, prev) !== false) {
                    this._recordMetricsBegin('loading previous page');
                    store.previousPage();
                }
            }
        },

        /**
         * Move to the next page of data
         */
        moveNext: function() {
            var store = this.getStore(),
                total = this._getPageData().pageCount,
                next = store.currentPage + 1;

            if (next <= total) {
                if (this.fireEvent('beforechange', this, next) !== false) {
                    this._recordMetricsBegin('loading next page');
                    store.nextPage();
                }
            }
        },

        /**
         * Move to the first page of data
         */
        moveFirst: function() {
            var store = this.getStore(),
                currentPage = store.currentPage;

            if (currentPage > 1) {
                if (this.fireEvent('beforechange', this, 1) !== false) {
                    this._recordMetricsBegin('loading first page');
                    this.getStore().loadPage(1);
                }
            }
        },

        /**
         * Move to the last page of data
         */
        moveLast: function() {
            var store = this.getStore(),
                currentPage = store.currentPage,
                lastPage = this._getPageData().pageCount;

            if (currentPage < lastPage) {
                if (this.fireEvent('beforechange', this, lastPage) !== false) {
                    this._recordMetricsBegin('loading last page');
                    this.getStore().loadPage(lastPage);
                }
            }
        },

        /**
         * Change the current page size
         * @param {Number} newSize New page size, must be a valid page size {@link #pageSizes}
         * @return {Boolean} If page size was changed
         */
        changePageSize: function(combobox, newSize) {
            newSize = newSize[0].get('value');

            if (this._isCurrentPageSize(newSize)) {
                return false;
            }

            var store = this.getStore();
            store.pageSize = newSize;
            store.currentPage = 1;
            this.ownerCt.refresh();
            var listView = this.up('rallylistview');
            if(listView) {
                listView.storePageSize(newSize);
            }
            this._reRender();
            return true;
        },

        _onBeforeRender: function() {
            this.renderData = this._getPageData();
        },

        /**
         * @private
         * @param {Number} size
         */
        _isCurrentPageSize: function(size) {
            return this.getStore().pageSize === size;
        },

        /**
         * @private
         * @return {Object}
         */
        _getPageData: function() {
            var store = this.getStore();

            if (!store) {
                return {
                    total: 0,
                    currentPage: 0,
                    pageCount: 0,
                    pageSize : 0,
                    start: 0,
                    end: 0,
                    pageSizes: 0
                };
            }

            var totalCount = store.getTotalCount() || 0,
                start = ((store.currentPage - 1) * store.pageSize) + 1;

            if (totalCount === 0) {
                start = 0;
            }

            return {
                total: totalCount,
                currentPage: store.currentPage,
                pageCount: Math.ceil(totalCount / store.pageSize),
                pageSize : store.pageSize,
                start: start,
                end: Math.min(store.currentPage * store.pageSize, totalCount),
                pageSizes: this.getPageSizes()
            };
        },

        _recordMetricsBegin: function(description) {
            this.loadingPage = true;

            this.recordLoadBegin({
                description: description,
                component: this.getStore().requester || this
            });
        },

        _recordMetricsEnd: function() {
            if (this.loadingPage) {
                this.recordLoadEnd({ component: this.getStore().requester || this });
                this.loadingPage = false;
            }
        },

        /**
         * Binds the pager to the Ext.data.Store
         * @param {Ext.data.Store} store The store to bind to this toolbar
         */
        bindStore: function(store) {
            if (store) {
                store = Ext.data.StoreManager.lookup(store);
                this.mon(store, 'load', this._onFirstLoad, this, {single: true});
                this.setStore(store);
            }
        }
    });

})();