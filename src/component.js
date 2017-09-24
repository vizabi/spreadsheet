import XLSX from "xlsx";


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
        name: "entities",
        type: "entities"
      },
      {
        name: "marker",
        type: "model"
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
  },

  readyOnce() {
    d3.select(this.parent.element).classed("vzb-timeslider-off", true);
    this.element = d3.select(this.element);
    this.tableEl = this.element.select("#vzb-spreadsheet-list").append("table");
    
    this.KEY = this.model.entities.getDimension();
    
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



  ready() {
    const _this = this;
    if (!this.model.marker.hook.which) return;
    
    
    let keys = this.model.marker.getKeys();
    let steps = this.model.time.getAllSteps();
    let timeFormatter = this.model.time.getFormatter();
    let valueFormatter = this.model.marker.hook.getTickFormatter();
    
    this.model.marker.getFrame(null, (values, time) => {
      let viewData = _this.element.select("#vzb-spreadsheet-content").select("#data");
      viewData.selectAll("table").remove();
      
      var table = viewData.append("table");
      steps = steps.filter((f) => {return _this.model.time.startSelected <= f && f <= _this.model.time.endSelected})
      
      keys.sort(function(b, a){ return d3.descending(values[_this.model.time.value].label[a[_this.KEY]], values[_this.model.time.value].label[b[_this.KEY]]) });
      
      table.selectAll("tr").data([""].concat(keys))
        .enter().append("tr")
        .classed("viz-spreadsheet-tablerow", (d,i) => i!==0)
        .each(function(r, i){
          const row = d3.select(this).selectAll("td").data([""].concat(steps))
            .enter().append("td")
            .classed("viz-spreadsheet-datacell", (c,j) => j!==0)
            .text((c, j) => {
              if (i==0 && j==0) return _this.KEY;
              if (i==0) return timeFormatter(c);
              if (j==0) return values[_this.model.time.value].label[r[_this.KEY]];
              return valueFormatter(values[c].hook[r[_this.KEY]], null, null, true) || ""
            });

          
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
    this.model.marker.hook.setWhich({concept: which, dataSource: "data"});
    var concept = this.conceptsDictionary[which];

    
    let viewAbout = this.element.select("#vzb-spreadsheet-content").select("#about");
    
    viewAbout.selectAll("div").remove();
    
    viewAbout.selectAll("div").data(["name", "description", "sourceLink", "scales"])
      .enter().append("div")
      .html(d=>{
        const conceptvalue = concept[d].indexOf("http")==0 ? ('<a href="' + concept[d] + '">' + concept[d] + '</a>') : concept[d];
      
        return '<div class="vzb-spreadsheet-conceptkey">' + d + '</div>' +
        '<div class="vzb-spreadsheet-conceptvalue">' + conceptvalue + '</div>'
      })
    
    
    let viewDl = this.element.select("#vzb-spreadsheet-content").select("#download");
    
    viewDl.selectAll("div").remove();
    viewDl.selectAll("div").data(["csv", "xls"])
      .enter().append("div").append("a").text(type=>type).on("click", type=>this._download(type));
    
  
    this._showTab();
  },
  
  
  _download(type){
    console.log(type)
  },
  

  
  _redraw() {
    const _this = this;
    
    const concepts = d3.keys(this.conceptsDictionary)
      .filter((f) => this.conceptsDictionary[f].tags.indexOf("_none")==-1  && this.conceptsDictionary[f].name && this.conceptsDictionary[f].concept_type === "measure")
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
    
  
  }


});

export default Spreadsheet;
