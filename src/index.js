import "./styles.scss";
import component from "./component";

export default Vizabi.Tool.extend("Spreadsheet", {

  init(placeholder, externalModel) {

    this.name = "spreadsheet";

    this.components = [
      {
        component,
        placeholder: ".vzb-tool-viz",
        model: ["state.time", "state.entities", "state.marker", "locale", "ui", "data"]
      }
    ];

    this._super(placeholder, externalModel);
  },

  default_model: {
    state:{
      time: {},
      entities: {},
      marker: {
        space: ["entities", "time"],
        hook: {
          _important: true
        },
        label: {
          use: "property"
        }
      }
    },
    locale: {
      id: "en"
    },
    ui: {}
  }

});
