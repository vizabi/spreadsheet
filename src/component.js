import XLSX from "../node_modules/xlsx/dist/xlsx.mini.min.js";
import { saveAs } from "file-saver";

import {
  BaseComponent,
  LegacyUtils as utils,
  Utils
} from "@vizabi/shared-components";
import * as d3 from "d3";

import {
  decorate,
  computed,
  runInAction
} from "mobx";


const charts = {
  BubbleChart: {toolsPageChartType: "bubbles", marker: "bubble", icon: "🎈", encoding: "y"},
  //  BubbleMap: {toolsPageChartType: "map", marker: "bubble", icon: "🌍", encoding: "color"},
  LineChart: {toolsPageChartType: "linechart", marker: "line", icon: "〽️", encoding: "y"}
};

class _VizabiSpreadsheet extends BaseComponent {
  constructor (config) {

    config.template = `
        <div id="vzb-spreadsheet-title"></div>
        <div id="vzb-spreadsheet-about"></div>
        <div id="vzb-spreadsheet-actions"></div>
        <div id="vzb-spreadsheet-table"></div>  
      `;

    super(config);
  }

  setup() {
    this.DOM = {
      title: this.element.select("#vzb-spreadsheet-title"),
      about: this.element.select("#vzb-spreadsheet-about"),
      actions: this.element.select("#vzb-spreadsheet-actions"),
      table: this.element.select("#vzb-spreadsheet-table")
    };

    this.root.element.classed("vzb-timeslider-off", true);

    this.treemenu = () => this.root.findChild({type: "TreeMenu"});
    this.DOM.title.on("click", () => this.treemenu().updateView().toggle());
  }

  get MDL() {
    return {
      number: this.model.encoding.number,
      frame: this.model.encoding.frame
    };
  }

  draw() {
    this.localise = this.services.locale.auto();
    this.fixHeaders = this.ui.fixHeaders;

    //if (this.updateLayoutProfile()) return; //return if exists with error
    this.DOM.title.classed("vzb-disabled", this.treemenu().state.ownReadiness !== Utils.STATUS.READY);

    if (this.treemenu().state.ownReadiness == Utils.STATUS.READY) {
      this.treemenu()
        .alignX(this.services.locale.isRTL() ? "right" : "left")
        .alignY("top")
        .title("")
        .scaletypeSelectorDisabled(true)
        .encoding("number");
      if (!this.MDL.number.data.concept) {
        this.treemenu().showWhenReady(true);
      }
    }

    this.addReaction(this._drawLoading);
    this.addReaction(this._drawTitle);
    this.addReaction(this._drawAboutSection);
    this.addReaction(this._drawActionsSection);
    this.addReaction(this._drawDataTable);  
  }

  _drawTitle() {
    const concept = this.MDL.number.data.conceptProps;  
    this.DOM.title.text(concept ? concept.name : "Select an indicator");
  }

  get dataMap() {
    return this.model.dataMapCache.groupBy(this.model.dataMapCache.key.slice(0, -1), this.model.dataMapCache.key.slice(-1));
  }

  _drawLoading() {
    const concept = this.MDL.number.data.concept;
    if (!concept) return;

    this.DOM.table.select(".viz-spreadsheet-keytable-wrapper").remove();
    this.DOM.table.select(".viz-spreadsheet-table-wrapper").remove();
    this.DOM.table.classed("vzb-spreadsheet-table-fix-headers", this.fixHeaders);
    this.DOM.table.append("div").attr("class","vzb-spreadsheet-loading").text("data table is loading...");
  }

  _drawDataTable() {
    this.DOM.table.selectAll("div.vzb-spreadsheet-loading").remove();

    runInAction(() => {
      const concept = this.MDL.number.data.concept;
      if (!concept) return;
    
      this.DOM.table.select(".viz-spreadsheet-keytable-wrapper").remove();
      this.DOM.table.select(".viz-spreadsheet-table-wrapper").remove();
      this.DOM.table.classed("vzb-spreadsheet-table-fix-headers", this.fixHeaders);
      this.DOM.actions.classed("vzb-hidden", false);
  
      const frameConcept = this.MDL.frame.data.concept;
      const steps = this.MDL.frame.domainValues.map(v => ({[frameConcept]: v}));
      const timeFormatter = this.localise;
      const valueFormatter = this.localise;
      const KEYS = this.dataMap.key;
  
      const table = this.DOM.table
        .append("div")
        .classed("viz-spreadsheet-table-wrapper", true)
        .append("table")
        .attr("id", "table_" + this.id)
        .classed("viz-spreadsheet-table", true);

      const scrollBarWidth = this.fixHeaders ? table.node().offsetWidth - table.node().clientWidth : 0;

      table.selectAll("tr").data([{}, ...this.dataMap.values()])
        .enter().append("tr")
        .attr("class", (d, i) => i ? "viz-spreadsheet-tablerow" : "viz-spreadsheet-headrow")
        .each(function(r, i){
          const labelObj = i == 0 ? {} : r.values().next().value.label;
          d3.select(this).selectAll("td").data(KEYS.concat(steps))
            .enter().append("td")
            .classed("viz-spreadsheet-keycell", (c,j) => j<KEYS.length)
            .text((c, j) => {
              if (i==0 && j<KEYS.length) return c;
              if (j<KEYS.length) return labelObj[c];
              if (i==0) return timeFormatter(c[frameConcept]);
              return valueFormatter(r.get(c)?.number) || "";
            });
        });

      if (this.fixHeaders) {

        const keysTable = this.DOM.table
          .append("div")
          .classed("viz-spreadsheet-keytable-wrapper", true)
          .lower()
          .append("table")
          .classed("viz-spreadsheet-keytable", true)
          .style("height", `calc(100% - ${scrollBarWidth}px)`);

        keysTable.selectAll("tr").data([{}, ...this.dataMap.values()])
          .enter().append("tr")
          .attr("class", (d, i) => i ? "viz-spreadsheet-tablerow" : "viz-spreadsheet-headrow")
          .each(function(r, i){
            const labelObj = i == 0 ? {} : r.values().next().value.label;
            d3.select(this).selectAll("td").data(KEYS)
              .enter().append("td")
              .attr("data-caption", c => i == 0 ? c : null)
              .text(c => {
                if (i==0) return "";
                return labelObj[c];
              });
          });

        const tableHeader = table
          .clone(true).lower()
          .attr("class", "viz-spreadsheet-table-header")
          .style("margin-right", scrollBarWidth + "px");

        table.on("scroll", function () {
          keysTable.node().scrollTop = this.scrollTop;
          tableHeader.node().scrollLeft = this.scrollLeft;
        });
      }
    });
  }

  _drawAboutSection() {
    const concept = this.MDL.number.data.conceptProps;
    if (!concept) return;

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
    //    this.model.marker.number.setWhich({concept: which, dataSource: "data"});

    
    this.DOM.about.selectAll("div").remove();
    
    this.DOM.about.selectAll("div.concept")
      .data(["description", "source", "source_url"].filter(f => concept[f]))
      .enter().append("div")
      .html(d=>{
        let value = d == "source_url" ? utils.normaliseLink(concept[d]) : concept[d];
        value = (value || "").indexOf("http")==0 ? ('<a href="' + value + '">' + value + "</a>") : value;

        return '<span class="vzb-spreadsheet-conceptkey">' + d + ":</span>" +
        '<span class="vzb-spreadsheet-conceptvalue">' + value + "</span>";
      });


  }

  _drawActionsSection() {
    const concept = this.MDL.number.data.conceptProps;
    if (!concept) return;

    this.DOM.actions.selectAll("div").remove();

    this.DOM.actions.classed("vzb-hidden", true);    

    this.DOM.actions.append("div")
      .attr("class", "vzb-spreadsheet-viewas")
      .text("View as:")
      .selectAll("a").data(Object.keys(charts))
      .enter().append("a")
      .text(chart=>charts[chart].icon)
      .attr("title", chart=>chart)
      .attr("target", "_blank")
      .attr("href", chart => this._viewAs(charts[chart], concept)); 

    this.DOM.actions.append("div")
      .attr("class", "vzb-spreadsheet-downloadas")
      .text("Download as:")
      .selectAll("a").data(["csv", "xlsx"])
      .enter().append("a")
      .text(type=>type)
      .on("click", (event, type) => this._download(type, concept.concept));  
  }
  
  _viewAs(chart, concept){
    const scaleType = (JSON.parse(concept.scales) || [])[0] || "linear";
    return window.location.origin + window.location.pathname 
      + `#$model$markers$${chart.marker}$encoding$${chart.encoding}$data$concept=${concept.concept};&scale$domain:null&zoomed:null&type=${scaleType};;;;;;&chart-type=${chart.toolsPageChartType}&url=v1`;    
  }

  _download(type, fileName){
    function s2ab(s) {
      if(typeof ArrayBuffer !== "undefined") {
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
      const wbout = XLSX.write(wb, { bookType: type, bookSST: true, type: "binary" });
      const fName = `${fileName}.${type}`;
      try {
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), fName);
      } catch(e) { if(typeof console != "undefined") console.log(e, wbout); }
      return wbout;
    }

    export_table_to_excel("table_" + this.id, type, fileName);    
  }

}

export const VizabiSpreadsheet = decorate(_VizabiSpreadsheet, {
  "dataMap": computed,
  "MDL": computed
});
