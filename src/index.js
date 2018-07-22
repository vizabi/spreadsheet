import "./styles.scss";
import "./treemenu-extension.scss";
import component from "./component";


const treemenuExtension = Vizabi.Component.getCollection().treemenu.extend("treemenu-extension", {
  init(config, context) {
    this._super(config, context);
    this.name = "treemenu-extension";
  }
})

export default Vizabi.Tool.extend("Spreadsheet", {

  init(placeholder, externalModel) {

    this.name = "spreadsheet";

    this.components = [
      {
        component,
        placeholder: ".vzb-tool-viz",
        model: ["state.time", "state.marker", "locale", "ui", "data"]
      },{
        component: treemenuExtension,
        placeholder: ".vzb-tool-treemenu",
        model: ["state.marker", "state.time", "locale", "ui"]
      } 
    ];

    this._super(placeholder, externalModel);
  },

  default_model: {
    state:{
      time: {
        "autoconfig": {
          "type": "time"
        }
      },
      entities: {
        "autoconfig": {
          "type": "entity_domain",
          "excludeIDs": ["tag"]
        }
      },
      marker: {
        space: ["entities", "time"],
        hook: {
          which: null,
          use: "indicator",
          _important: true
        },
        label: {
          use: "property",
          "autoconfig": {
            "includeOnlyIDs": ["name"],
            "type": "string"
          }
        }
      }
    },
    locale: {
      id: "en"
    },
    ui: {}
  }

});
