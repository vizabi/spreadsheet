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
      time: {
        autogenerate: {
          data: "data",
          conceptIndex: 0,
          conceptType: "time"
        }
      },
      entities: {
        dim:"geo",
        autogenerate: {
          data: "data",
          conceptIndex: 0,
          conceptType: "entity_domain"
        }
      },
      marker: {
        space: ["entities", "time"],
        hook: {
          _important: true
        },
        label: {
          use: "property",
          which: "name"
        }
      }
    },
    locale: {
      id: "en"
    },
    ui: {}
  }

});
