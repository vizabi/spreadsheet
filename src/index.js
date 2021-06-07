import "./styles.scss";
import { 
  BaseComponent,
  LocaleService,
  LayoutService,
  TreeMenu,
  CapitalVizabiService,
  versionInfo
} from "VizabiSharedComponents";
import { VizabiSpreadsheet } from "./component";


export default class Spreadsheet extends BaseComponent {

  constructor(config){

    Vizabi.utils.applyDefaults(config.model.markers.spreadsheet.config, Spreadsheet.DEFAULT_CORE);    
    const marker = config.model.markers.spreadsheet;

    config.name = "spreadsheet";

    config.subcomponents = [{
      type: VizabiSpreadsheet,
      placeholder: ".vzb-spreadsheet",
      model: marker,
      name: "chart"
    },{
      type: TreeMenu,
      placeholder: ".vzb-treemenu",
      model: marker,
      name: "tree-menu"
    }];

    config.template = `
      <div class="vzb-spreadsheet"></div>
      <div class="vzb-treemenu"></div>
    `;
  
    config.services = {
      Vizabi: new CapitalVizabiService({Vizabi: config.Vizabi}),
      locale: new LocaleService(config.locale),
      layout: new LayoutService({placeholder: config.placeholder})
    };

    super(config);
  }
}


Spreadsheet.DEFAULT_UI = {
  chart: {
    fixHeaders: true
  },
};

Spreadsheet.DEFAULT_CORE = {
  requiredEncodings: ["hook"],
  encoding: {
    "hook": {
      data: {
        constant: "true"
      },
      scale: {
        allowedTypes: ["linear", "log", "genericLog", "pow", "point"]
      }
    },
    "label": {
      data: {
        modelType: "entityPropertyDataConfig"
      }
    },
    "frame": {
      modelType: "frame"
    }
  }
}

Spreadsheet.versionInfo = { version: __VERSION, build: __BUILD, package: __PACKAGE_JSON_FIELDS, sharedComponents: versionInfo};

/*
const treemenuExtension = Vizabi.Component.getCollection().treemenu.extend("treemenu-extension", {
  init(config, context) {
    this._super(config, context);
    this.name = "treemenu-extension";
  }
})

Vizabi.Tool.extend("Spreadsheet", {

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
          disable_gapfill: true,
          _important: true,
          allow: {
            scales: ["linear", "log", "genericLog"]
          }
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
    ui: {
      chart: {
        fixHeaders: true
      }
    }
  }

});
*/
