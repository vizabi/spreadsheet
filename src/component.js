import XLSX from "xlsx";
import { saveAs } from "file-saver";

const {
  Component,
  utils,
  iconset,
} = Vizabi;

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

    this.root.on("ready", () => this.toolReady());
  },

  readyOnce() {
    d3.select(this.parent.element).classed("vzb-timeslider-off", true);
    this.element = d3.select(this.element);
    this.tableEl = this.element.select("#vzb-spreadsheet-list").append("table");

    this.KEYS = utils.unique(this.model.marker._getAllDimensions({ exceptType: "time" }));
    this.KEY = this.KEYS.join(",");

    this.conceptsDictionary = this.model.data.getConceptprops();
    this._redraw();

    const tabs = ["about", "data", "download"];

    this.explorerEl = this.element.select("#vzb-spreadsheet-explorer");
    this.explorerEl.select(".vzb-close-x")
      .on("click", ()=>{this.explorerEl.style("display", "none")})

    this.contentPanesEl = this.element.select("#vzb-spreadsheet-content").selectAll("div").data(tabs)
      .enter().append("div")
      .attr("id", d=>d);


    this.tabsEl = this.element.select("#vzb-spreadsheet-tabs").selectAll("div.vzb-spreadsheet-tab").data(tabs)
      .enter().append("div")
      .attr("id", d=>d)
      .classed("vzb-spreadsheet-tab", true)
      .text(d=>d)
      .on("click", (d) => this._showTab(d));

    if(this.model.marker.hook.which) this._showDetails(this.model.marker.hook.which);
  },

  toolReady() {
    const _this = this;
    if (!this.model.marker.hook.which) return;

    const KEYS = this.KEYS = utils.unique(this.model.marker._getAllDimensions({ exceptType: "time" }));
    this.KEY = this.KEYS.join(",");
    const dataKeys =  this.dataKeys = this.model.marker.getDataKeysPerHook();
    const labelNames = this.labelNames = this.model.marker.getLabelHookNames();

    const keys = this.model.marker.getKeys();
    let steps = this.model.time.getAllSteps();
    const timeFormatter = this.model.time.getFormatter();
    const valueFormatter = this.model.marker.hook.getTickFormatter();

    this.model.marker.getFrame(null, (values, time) => {
      const viewData = _this.element.select("#vzb-spreadsheet-content").select("#data");
      viewData.selectAll("table").remove();

      const table = viewData.append("table")
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

  resize() {
  },

  _showTab(tab = "about"){    
    this.explorerEl.style("display", "block");
    this.contentPanesEl.style("display", (p) => p == tab ? null : "none"); 

    this.tabsEl.classed("vzb-active", (p) => p == tab); 
  },

  _showDetails(which) {
    const _this = this;
    const concept = this.conceptsDictionary[which];

    const dataAvailable = this.model.data.dataAvailability.datapoints
      .reduce((result, item) => {
        if (item.value !== which) return result;
        result.push({
          key: [...item.key].join(","),
          value: [...item.key]
        })
        return result;
      }, []);

    let viewAbout = this.element.select("#vzb-spreadsheet-content").select("#about");
    viewAbout.selectAll("div").remove();

    const selectorEl = viewAbout.append("div").style("display", dataAvailable.length > 1 ? "block" : "none")
      .call(selection => selection.append("div").classed("vzb-spreadsheet-conceptkey", true).text("dimensions"))
      .append("div").classed("vzb-spreadsheet-conceptvalue", true)
      .append("div").classed("vzb-spreadsheet-select", true)
      .append("select").on("change", function(evt) {
        const d = d3.select(this.options[this.options.selectedIndex]).datum();
        _this.model.marker.setSpace(d.value);
        utils.defer(() => _this.model.marker.startLoading());
      })
    selectorEl.selectAll("option").data(dataAvailable, d => d.key).enter().append("option").text(d => d.key);

    const allKeys = utils.unique(this.model.marker._getAllDimensions()).join(",");
    const selectedIndex = dataAvailable.map(d => d.key).indexOf(allKeys);
    selectorEl.property("selectedIndex", selectedIndex === -1 ? 0: selectedIndex);
    if (selectedIndex === -1) selectorEl.dispatch("change");

    this.model.marker.hook.setWhich({concept: which, dataSource: "data"});

    viewAbout.selectAll("div.concept").data(["name", "description", "sourceLink", "scales"])
      .enter().append("div")
      .html(d=>{
        const conceptvalue = (concept[d] || "").indexOf("http")==0 ? ('<a href="' + concept[d] + '">' + concept[d] + '</a>') : concept[d];

        return '<div class="vzb-spreadsheet-conceptkey">' + d + '</div>' +
        '<div class="vzb-spreadsheet-conceptvalue">' + conceptvalue + '</div>'
      })

    let viewDl = this.element.select("#vzb-spreadsheet-content").select("#download");

    viewDl.selectAll("div").remove();
    viewDl.selectAll("div").data(["csv", "xlsx"])
      .enter().append("div").append("a").text(type=>type).on("click", type=>this._download(type, which));

    this._showTab();
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
  },

  _redraw() {
    const _this = this;

    const concepts = d3.keys(this.conceptsDictionary)
      .filter((f) => (this.conceptsDictionary[f].tags || "").indexOf("_none")==-1  && this.conceptsDictionary[f].name && this.conceptsDictionary[f].concept_type === "measure")
      .sort((a,b) => {
        if (this.conceptsDictionary[a].tags > this.conceptsDictionary[b].tags) return 1;
        if (this.conceptsDictionary[a].tags < this.conceptsDictionary[b].tags) return -1;
        return 0;
      })

    let header = this.tableEl.append("tr");
    header.append("th").text("name");
    header.append("th").text("tags");

    let rowsEl = this.tableEl.selectAll("tr.viz-spreadsheet-tablerow").data(concepts);

    rowsEl.exit().remove();

    rowsEl.enter().append("tr")
      .classed("viz-spreadsheet-tablerow", true)
      .on("click", r => this._showDetails(r))
      .each(function(r, i){
        const view = d3.select(this);
        view.append("td").text((d) => _this.conceptsDictionary[d].name);
        view.append("td").text((d) => _this.conceptsDictionary[d].tags);
      })
      .merge(rowsEl);


  }


});

export default Spreadsheet;
