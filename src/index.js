import "./styles.scss";
import component from "./component";

export default Vizabi.Tool.extend("Spreadsheet", {

  init(placeholder, externalModel) {

    this.name = "spreadsheet";

    this.components = [
      {
        component,
        placeholder: ".vzb-tool-viz",
        model: ["state.time", "state.marker", "locale", "ui", "data"]
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
