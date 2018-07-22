import XLSX from "xlsx";
import { saveAs } from "file-saver";

const {
  Component,
  utils,
  iconset,
} = Vizabi;

const charts = {
  BubbleChart: {toolsPageChartType: "bubbles", icon: "🎈", hook: "axis_y"},
  BubbleMap: {toolsPageChartType: "map", icon: "🌍", hook: "color"},
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

    this.treemenu = this.parent
      .findChildByName("treemenu-extension")
      .alignX(this.model.locale.isRTL() ? "right" : "left")
      .alignY("top")
      .markerID("hook");
    
    this.titleEl.on("click", () => this.treemenu.updateView().toggle());
  },

  ready() {
    if(!this.model.marker.hook.which) {
      //open treemenu so that indicator can be selected
      this.treemenu.alwaysVisible(true);
    } else {
      const concept = this.model.marker.hook.getConceptprops();
      this._drawTitle(concept);
      this._drawAboutSection(concept);
      this._drawActionsSection(concept);
      this._drawDataTable(concept);
      this.resize();
    }
  },
    
  resize() {
    this.tableEl.style("height", 
      utils.px2num(this.element.style("height")) 
      - utils.px2num(this.titleEl.style("height"))
      - utils.px2num(this.aboutEl.style("height"))
      - utils.px2num(this.actionsEl.style("height"))
      + "px"
    );
  },
  
  _drawTitle(concept) {
    this.titleEl
      .text(concept.name);
  },

  
  
  //TODO: make header and column 1 presistent like so https://codepen.io/MaxArt2501/pen/qLCmE
  _drawDataTable(concept) {
    const _this = this;

    const KEYS = this.KEYS;
    const dataKeys =  this.dataKeys = this.model.marker.getDataKeysPerHook();
    const labelNames = this.labelNames = this.model.marker.getLabelHookNames();

    const keys = this.model.marker.getKeys();
    let steps = this.model.time.getAllSteps();
    const timeFormatter = this.model.time.getFormatter();
    const valueFormatter = this.model.marker.hook.getTickFormatter();

    this.model.marker.getFrame(null, (values, time) => {
      _this.tableEl.selectAll("table").remove();

      const table = _this.tableEl.append("table")
        .attr("id", "table_" + _this._id);
      steps = steps.filter((f) => {return _this.model.time.startSelected <= f && f <= _this.model.time.endSelected})

      keys.sort(function(b, a) { return d3.descending(values[_this.model.time.value].label[utils.getKey(a, dataKeys.label)], values[_this.model.time.value].label[utils.getKey(b, dataKeys.label)]) });

      table.selectAll("tr").data([""].concat(keys))
        .enter().append("tr")
        .classed("viz-spreadsheet-tablerow", (d,i) => i!==0)
        .each(function(r, i){
          const row = d3.select(this).selectAll("td").data(KEYS.concat(steps))
            .enter().append("td")
            .classed("viz-spreadsheet-datacell", (c,j) => j>=KEYS.length)
            .text((c, j) => {
              if (i==0 && j<KEYS.length) return c;
              if (i==0) return timeFormatter(c);
              if (j<KEYS.length) return values[_this.model.time.value][labelNames[c]][utils.getKey(r, dataKeys[labelNames[c]])];
              return valueFormatter(values[c].hook[utils.getKey(r, dataKeys.hook)], null, null, true) || ""
            })
        })
      })
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
    
    this.aboutEl.selectAll("div.concept").data(["description", "sourceLink", "scales"])
      .enter().append("div")
      .html(d=>{
        const conceptvalue = (concept[d] || "").indexOf("http")==0 ? ('<a href="' + concept[d] + '">' + concept[d] + '</a>') : concept[d];

        return '<span class="vzb-spreadsheet-conceptkey">' + d + ':</span>' +
        '<span class="vzb-spreadsheet-conceptvalue">' + conceptvalue + '</span>'
      })


  },
  
  _drawActionsSection(concept){
    this.actionsEl.selectAll("div").remove();
    
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
    return `https://www.gapminder.org/tools/#$state$marker$${chart.hook}$which=${concept.concept}&domainMin:null&domainMax:null&zoomedMin:null&zoomedMax:null&scaleType=${scaletype}&spaceRef:null;;;&chart-type=${chart.toolsPageChartType}`
    
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
