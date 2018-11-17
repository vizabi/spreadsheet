import XLSX from "xlsx";
import { saveAs } from "file-saver";

const {
  Component,
  utils,
  iconset,
} = Vizabi;

const charts = {
  BubbleChart: {toolsPageChartType: "bubbles", icon: "🎈", hook: "axis_y"},
//  BubbleMap: {toolsPageChartType: "map", icon: "🌍", hook: "color"},
  LineChart: {toolsPageChartType: "linechart", icon: "〽️", hook: "axis_y"}
};

const Spreadsheet = Component.extend("spreadsheet", {

  init(config, context) {
    this.name = "spreadsheet-component";
    this.template = require("./template.html");

    //define expected models for this component
    this.model_expects = [
      {
        name: "time",
        type: "time"
      },
      {
        name: "marker",
        type: "marker"
      },
      {
        name: "locale",
        type: "locale"
      },
      {
        name: "ui",
        type: "ui"
      },
      {
        name: "data",
        type: "data"
      }
    ];

    this.model_binds = {};

    this._super(config, context);

    //this.root.on("ready", () => this.toolReady());
  },

  readyOnce() {
    d3.select(this.parent.element).classed("vzb-timeslider-off", true);
    this.element = d3.select(this.element);
    this.titleEl = this.element.select("#vzb-spreadsheet-title");
    this.aboutEl = this.element.select("#vzb-spreadsheet-about");
    this.actionsEl = this.element.select("#vzb-spreadsheet-actions");
    this.tableEl = this.element.select("#vzb-spreadsheet-table");

    this.KEYS = utils.unique(this.model.marker._getAllDimensions({ exceptType: "time" }));
    this.KEY = this.KEYS.join(",");

    this.fixHeaders = (this.model.ui.chart || {}).fixHeaders;

    this.treemenu = this.parent
      .findChildByName("treemenu-extension")
      .alignX(this.model.locale.isRTL() ? "right" : "left")
      .alignY("top")
      .title("")
      .scaletypeSelectorDisabled(true)
      .markerID("hook");
    
    this.titleEl.on("click", () => this.treemenu.updateView().toggle());
  },

  ready() {
    const _this = this;
    
    if(!this.model.marker.hook.which) {
      //open treemenu so that indicator can be selected
      this.treemenu.showWhenReady(true);
      this.titleEl.text("Select an indicator");
    } else {
      const concept = this.model.marker.hook.getConceptprops();
      this._drawTitle(concept);
      this._drawAboutSection(concept);
      this._drawActionsSection(concept);
      this._drawDataTable(concept);
    }
  },
    
  resize() {
  },
  
  _drawTitle(concept) {
    this.titleEl
      .text(concept.name);
  },

  
  
  //TODO: make header and column 1 presistent like so https://codepen.io/MaxArt2501/pen/qLCmE
  _drawDataTable(concept) {
    const _this = this;
    this.tableEl.select(".viz-spreadsheet-keytable-wrapper").remove();
    this.tableEl.select(".viz-spreadsheet-table-wrapper").remove();
    this.tableEl.classed("vzb-spreadsheet-table-fix-headers", this.fixHeaders);
    this.tableEl.append("div").attr("class","vzb-spreadsheet-loading").text("data table is loading...");
    
    const KEYS = this.KEYS;
    const dataKeys =  this.dataKeys = this.model.marker.getDataKeysPerHook();
    const labelNames = this.labelNames = this.model.marker.getLabelHookNames();

    const keys = this.model.marker.getKeys();
    let steps = this.model.time.getAllSteps();
    const timeFormatter = this.model.time.getFormatter();
    const valueFormatter = this.model.marker.hook.getTickFormatter();

    this.model.marker.getFrame(null, (values, time) => {
      
      _this.tableEl.select("div.vzb-spreadsheet-loading").remove();
      _this.actionsEl.classed("vzb-hidden", false);

      keys.sort(function(b, a) { return d3.descending(values[_this.model.time.value].label[utils.getKey(a, dataKeys.label)], values[_this.model.time.value].label[utils.getKey(b, dataKeys.label)]) });

      const table = _this.tableEl
      .append("div")
        .classed("viz-spreadsheet-table-wrapper", true)
      .append("table")
        .attr("id", "table_" + _this._id)
        .classed("viz-spreadsheet-table", true)

      table.selectAll("tr").data([""].concat(keys))
        .enter().append("tr")
        .attr("class", (d, i) => i ? "viz-spreadsheet-tablerow" : "viz-spreadsheet-headrow")
        .each(function(r, i){
          const row = d3.select(this).selectAll("td").data(KEYS.concat(steps))
            .enter().append("td")
            .classed("viz-spreadsheet-keycell", (c,j) => j<KEYS.length)
            .text((c, j) => {
              if (i==0 && j<KEYS.length) return c;
              if (i==0) return timeFormatter(c);
              if (j<KEYS.length) return values[_this.model.time.value][labelNames[c]][utils.getKey(r, dataKeys[labelNames[c]])];
              return valueFormatter(values[c].hook[utils.getKey(r, dataKeys.hook)], null, null, true) || "";
            })
        });

      if (this.fixHeaders) {
        const keysTable = _this.tableEl
          .append("div")
            .classed("viz-spreadsheet-keytable-wrapper", true)
          .lower()
          .append("table")
            .attr("id", "table_keys_" + _this._id)
            .classed("viz-spreadsheet-keytable", true)

        keysTable.selectAll("tr").data([""].concat(keys))
          .enter().append("tr")
          .attr("class", (d, i) => i ? "viz-spreadsheet-tablerow" : "viz-spreadsheet-headrow")
          .each(function(r, i){
            const row = d3.select(this).selectAll("td").data(KEYS)
              .enter().append("td")
              .attr("data-caption", c => i == 0 ? c : null)
              .text((c, j) => {
                if (i==0) return "";
                return values[_this.model.time.value][labelNames[c]][utils.getKey(r, dataKeys[labelNames[c]])];
              })
          });

        const tableHeader = table.clone(true).lower()
          .attr("id", "table_header_" + _this._id)
          .attr("class", "viz-spreadsheet-table-header");

        const scrollBarWidth = table.node().offsetWidth - table.node().clientWidth;
        tableHeader.style("margin-right", scrollBarWidth + "px");
        keysTable.style("height", `calc(100% - ${scrollBarWidth}px)`);

        table.on("scroll", function () {
          keysTable.node().scrollTop = this.scrollTop;
          tableHeader.node().scrollLeft = this.scrollLeft;
        });
      }
    });

  },



  _drawAboutSection(concept) {
    const _this = this;

//    const dataAvailable = this.model.data.dataAvailability.datapoints
//      .reduce((result, item) => {
//        if (item.value !== which) return result;
//        result.push({
//          key: [...item.key].join(","),
//          value: [...item.key]
//        })
//        return result;
//      }, []);
//
//    let viewAbout = this.element.select("#vzb-spreadsheet-content").select("#about");
//
//    const selectorEl = viewAbout.append("div").style("display", dataAvailable.length > 1 ? "block" : "none")
//      .call(selection => selection.append("div").classed("vzb-spreadsheet-conceptkey", true).text("dimensions"))
//      .append("div").classed("vzb-spreadsheet-conceptvalue", true)
//      .append("div").classed("vzb-spreadsheet-select", true)
//      .append("select").on("change", function(evt) {
//        const d = d3.select(this.options[this.options.selectedIndex]).datum();
//        _this.model.marker.setSpace(d.value);
//        utils.defer(() => _this.model.marker.startLoading());
//      })
//    selectorEl.selectAll("option").data(dataAvailable, d => d.key).enter().append("option").text(d => d.key);
//
//    const allKeys = utils.unique(this.model.marker._getAllDimensions()).join(",");
//    const selectedIndex = dataAvailable.map(d => d.key).indexOf(allKeys);
//    selectorEl.property("selectedIndex", selectedIndex === -1 ? 0: selectedIndex);
//    if (selectedIndex === -1) selectorEl.dispatch("change");
//
//    this.model.marker.hook.setWhich({concept: which, dataSource: "data"});

    
    this.aboutEl.selectAll("div").remove();
    
    this.aboutEl.selectAll("div.concept")
      .data(["description", "sourceName", "sourceLink"].filter(f => concept[f]))
      .enter().append("div")
      .html(d=>{
        let value = d == "sourceLink" ? utils.normaliseLink(concept[d]) : concept[d];
        value = (value || "").indexOf("http")==0 ? ('<a href="' + value + '">' + value + '</a>') : value;

        return '<span class="vzb-spreadsheet-conceptkey">' + d + ':</span>' +
        '<span class="vzb-spreadsheet-conceptvalue">' + value + '</span>'
      })


  },
  
  _drawActionsSection(concept){
    this.actionsEl.selectAll("div").remove();
    
    this.actionsEl.classed("vzb-hidden", true);
    
    this.actionsEl.append("div")
      .attr("class", "vzb-spreadsheet-viewas")
      .text("View as:")
      .selectAll("a").data(Object.keys(charts))
      .enter().append("a")
      .text(chart=>charts[chart].icon)
      .attr("title", chart=>chart)
      .attr("target", "_blank")
      .attr("href", chart => this._viewAs(charts[chart], concept)); 
    
    this.actionsEl.append("div")
      .attr("class", "vzb-spreadsheet-downloadas")
      .text("Download as:")
      .selectAll("a").data(["csv", "xlsx"])
      .enter().append("a")
      .text(type=>type)
      .on("click", type => this._download(type, concept.concept));  
  },
  
  _viewAs(chart, concept){
    const scaletype = (concept.scales || [])[0] || "linear";
    return window.location.origin + window.location.pathname 
      + `#$state$marker$${chart.hook}$which=${concept.concept}&domainMin:null&domainMax:null&zoomedMin:null&zoomedMax:null&scaleType=${scaletype}&spaceRef:null;;;&chart-type=${chart.toolsPageChartType}`
    
  },

  _download(type, fileName){
    function s2ab(s) {
      if(typeof ArrayBuffer !== 'undefined') {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      } else {
        const buf = new Array(s.length);
        for (let i=0; i!=s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
        return buf;
      }
    }

    function export_table_to_excel(id, type, fileName) {
    const wb = XLSX.utils.table_to_book(document.getElementById(id), { sheet: fileName.slice(0, 31) });
    const wbout = XLSX.write(wb, { bookType: type, bookSST: true, type: 'binary' });
    const fName = `${fileName}.${type}`;
    try {
      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), fName);
    } catch(e) { if(typeof console != 'undefined') console.log(e, wbout); }
    return wbout;
    }

    export_table_to_excel('table_' + this._id, type, fileName);    
  }


});

export default Spreadsheet;
