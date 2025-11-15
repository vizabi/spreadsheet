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

const KEY = Symbol.for("key");

class _VizabiSpreadsheet extends BaseComponent {
  constructor (config) {

    config.template = `
        <div id="vzb-spreadsheet-title"></div>
        <div id="vzb-spreadsheet-about"></div>
        <div id="vzb-spreadsheet-actions"></div>
        <div id="vzb-spreadsheet-table"></div>  
        <div id="vzb-spreadsheet-table-export"></div>  
      `;

    super(config);
  }

  setup() {
    this.DOM = {
      title: this.element.select("#vzb-spreadsheet-title"),
      about: this.element.select("#vzb-spreadsheet-about"),
      actions: this.element.select("#vzb-spreadsheet-actions"),
      table: this.element.select("#vzb-spreadsheet-table"),
      exportTable: this.element.select("#vzb-spreadsheet-table-export")      
    };

    this.root.element.classed("vzb-timeslider-off", true);

    this.treemenu = () => this.root.findChild({type: "TreeMenu"});
    this.DOM.title.on("click", () => this.treemenu().updateView().toggle());
  }

  get MDL() {
    return {
      number: this.model.encoding.number,
      frame: this.model.encoding.frame,
      label: this.model.encoding.label,
      selected: this.model.encoding.selected,
      highlighted: this.model.encoding.highlighted
    };
  }

  draw() {
    this.localise = this.services.locale.auto();
    this.fixHeaders = this.ui.fixHeaders;
    this.pivot = this.ui.pivot;

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
    this.addReaction(this._updateHighlightSelected);
  }

  _updateHighlightSelected() {
    const _highlighted = this.MDL.highlighted.data.filter;
    const _selected = this.MDL.selected.data.filter;
    
    const classRow = "viz-spreadsheet-tablerow";
    const classHeadRow = "viz-spreadsheet-headrow";
    let addClass;

    this.DOM.tableRows?.attr("class", (d, i) => {
      if (i === 0) return classHeadRow; //header row
      addClass = "";
      if (_highlighted.has(d[0])) addClass += " highlighted";
      if (_selected.has(d[0])) addClass += " selected";

      return classRow + addClass;
    });
  }

  _drawTitle() {
    const concept = this.MDL.number.data.conceptProps;  
    this.DOM.title.text(concept ? concept.name : "Select an indicator");
  }

  get dataMap() {
    const groups = [this.model.dataMapCache.key.slice(0, -1), this.model.dataMapCache.key.slice(-1)];
    return this.pivot ? this.model.dataMapCache.groupBy(...groups) : this.model.dataMapCache;
  }

  _drawLoading() {
    const concept = this.MDL.number.data.concept;
    if (!concept) return;

    this.DOM.table.select(".viz-spreadsheet-table-wrapper").remove();
    this.DOM.exportTable.select("table").remove();
    this.DOM.table.classed("vzb-spreadsheet-table-fix-headers", this.fixHeaders);
    this.DOM.table.append("div").attr("class","vzb-spreadsheet-loading").text("data table is loading...");
  }

  _drawDataTable() {
    this.ui.pivot;
    this.DOM.table.selectAll("div.vzb-spreadsheet-loading").remove();

    runInAction(() => {
      const concept = this.MDL.number.data.concept;
      if (!concept) return;

      const _this = this;
    
      this.DOM.table.select(".viz-spreadsheet-table-wrapper").remove();
      this.DOM.exportTable.select("table").remove();
      this.DOM.table.classed("vzb-spreadsheet-table-fix-headers", this.fixHeaders);
      this.DOM.table.classed("vzb-spreadsheet-table-pivoted", this.pivot);
      this.DOM.actions.classed("vzb-hidden", false);
  
      const frameConcept = this.MDL.frame.data.concept;
      const labelConcept = this.MDL.label.data.concept;
      const timeFormatter = this.localise;
      const valueFormatter = this.localise;
      const exportValueFormatter = v => v;
      const KEYS = this.dataMap.key;
      const numberConceptId = this.MDL.number.data.conceptProps.concept || "number";
      const steps = this.pivot ? this.MDL.frame.domainValues.map(v => ({[frameConcept]: v})) : ["number"];

      const tableWrapper = this.DOM.table
        .append("div")
        .classed("viz-spreadsheet-table-wrapper", true);
      const table = tableWrapper
        .append("table")
        .attr("id", "table_" + this.id)
        .classed("viz-spreadsheet-table", true);
      const exportTable = this.DOM.exportTable
        .append("table")
        .attr("id", "export_table_" + this.id)
        .classed("viz-spreadsheet-table-export", true);

      function fillTable(tableSelector, _valueFormatter) {
        return tableSelector.selectAll("tr").data([{}, ..._this.dataMap.entries()])
          .join(enter => enter.append("tr")
            .attr("class", (d, i) => i ? "viz-spreadsheet-tablerow" : "viz-spreadsheet-headrow")
            .each(function(row, rowIndex) {
              const example = rowIndex == 0 ? {} : (_this.pivot ? row[1].values().next().value : row[1] );
              d3.select(this).selectAll("td").data(KEYS.concat("label").concat(steps))
                .enter().append("td")
                .classed("viz-spreadsheet-keycell", (col,colIndex) => colIndex <= KEYS.length)
                .text((col, colIndex) => {
                  if (_this.pivot) {
                    if (rowIndex==0) {
                      if (colIndex < KEYS.length) return col;
                      if (colIndex === KEYS.length) return labelConcept;
                      if (colIndex > KEYS.length) return timeFormatter(col[frameConcept]);
                    } else {
                      if (colIndex < KEYS.length) return example[col];
                      if (colIndex === KEYS.length) return _this._getLabelText(example);
                      if (colIndex > KEYS.length) return _valueFormatter(row[1].get(col)?.number) || "";
                    }
                  } else {
                    if (rowIndex==0) {
                      if (colIndex < KEYS.length) return col;
                      if (colIndex === KEYS.length) return labelConcept;
                      if (colIndex > KEYS.length) return numberConceptId;
                    } else {
                      if (colIndex < KEYS.length) return col !== frameConcept ? row[1][col] : timeFormatter(row[1][frameConcept]);
                      if (colIndex === KEYS.length) return _this._getLabelText(example);
                      if (colIndex > KEYS.length) return _valueFormatter(row?.[1]?.number) || "";
                    }
                  }
                });
            })
          );
      }

      this.DOM.tableRows = fillTable(table, valueFormatter);
      if (this.pivot) {
        this.DOM.tableRows
          .on("mouseover", (evt, d) => {
            if (Object.keys(d).length === 0) return;
            _this.MDL.highlighted.data.filter.set(d[0]);
          })
          .on("mouseout", (evt, d) => {
            if (Object.keys(d).length === 0) return;
            _this.MDL.highlighted.data.filter.delete(d[0]);
          })
          .on("click", (evt, d) => {
            if (Object.keys(d).length === 0) return;
            _this.MDL.selected.data.filter.toggle(d[0]);
          });

        this.DOM.tableRows.selectAll(".viz-spreadsheet-keycell")
          .on("contextmenu", (evt) => {
            evt.preventDefault();
            const d = d3.select(evt.currentTarget.parentNode).datum();
            if (Object.keys(d).length === 0) return;

            const dataKey = {[KEY] : d[0]};
            dataKey.name = this._getLabelText(d[1].rows().next().value);
            const toolNode = this.element.node();
            const rootNode = this.root.element.node();

            //set context menu
            const contextMenuComponent = this.root.findChild({type: "MarkerContextmenu"});
            contextMenuComponent.show(dataKey, {
              x: evt.x - rootNode.offsetLeft - toolNode.offsetLeft - 5,
              y: evt.y - rootNode.offsetTop - toolNode.offsetTop - 5
            });
          });
      }

      fillTable(exportTable, exportValueFormatter);

      if (this.fixHeaders && this.pivot && KEYS.length > 1) {
        const keysSelection = table.selectAll("tr").selectAll(".viz-spreadsheet-keycell");
        const headerWidths = [];
        table.select("tr").selectAll(".viz-spreadsheet-keycell").each(function(d, i) {
          headerWidths[i] = this.getBoundingClientRect().width;
        });
        keysSelection.each(function(d, i) {
          if (i == 0) return;
          d3.select(this).style("left", headerWidths[i - 1] + "px");
        });
      }
    });
  }

  _drawAboutSection() {
    const concept = this.MDL.number.data.conceptProps;
    if (!concept) return;
    
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
      .text("Send to:")
      .selectAll("a").data(this.ui.sendTools)
      .enter().append("a")
      .text(d => d.icon + " " + d.label)
      .attr("target", "_blank")
      .attr("href", ".")
      .on("click", (evt, d) => {
        let hRef = location.href
          .replace("chart-type=spreadsheet", `chart-type=${d.tool}`)
          .replace("model$markers$spreadsheet", `model$markers$${d.marker}`)
          .replace("number$data$concept", `${d.encoding}$data$concept`);
        if (d.selected) hRef =  hRef.replace("selected$data$filter", `${d.selected}$show:false&data$filter`);
        d3.select(evt.currentTarget).attr("href", hRef);
      });

    this.DOM.actions.append("div")
      .attr("class", "vzb-spreadsheet-downloadas")
      .text("Download as:")
      .selectAll("a").data(["csv", "xlsx"])
      .enter().append("a")
      .text(type=>type)
      .on("click", (event, type) => this._download(type, concept.concept));  
  }
  
  _viewAs(chart, concept){
    const scaleType = concept.scales && JSON.parse(concept.scales)[0].trim() || "linear";
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
      const wb = XLSX.utils.table_to_book(document.getElementById(id), { 
        sheet: fileName.slice(0, 31),
        raw: true
      });
      const wbout = XLSX.write(wb, { bookType: type, bookSST: true, type: "binary" });
      const fName = `${fileName}.${type}`;
      try {
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), fName);
      } catch(e) { throw(e, wbout); }
      return wbout;
    }

    export_table_to_excel("export_table_" + this.id, type, fileName);    
  }

  _getLabelText(d) {
    const markerSpace = this.model.data.space;
    if (typeof d.label == "object") 
      return Object.entries(d.label)
        .filter(([k]) => k != this.MDL.frame.data.concept)
        //sort parts of the name along the marker space array, so we get geo, gender instead of gender, geo
        .sort(([ak], [bk]) => markerSpace.indexOf(ak) - markerSpace.indexOf(bk))
        //add keys where values are numbers, such as "age: 69"
        .map(([k, v]) => utils.isNumber(v) ? k + ": " + v : v)
        .join(", ");
    if (d.label != null) return "" + d.label;
    return d[KEY];
  }

}

export const VizabiSpreadsheet = decorate(_VizabiSpreadsheet, {
  "dataMap": computed,
  "MDL": computed
});
