import { Injectable } from '@angular/core';
import * as d3 from "d3";
import * as _ from "lodash";

export interface seriesItem {
  name:string;
  data:number[];
}

export interface nodeItem {
  name:string;
  data:number[];
  percentualVariation:number;
  lPos:number;
  rPos:number;
}

@Injectable()
export class SlopegraphLayoutService {
  private _height;
  private series;

  constructor() { }


  /**
   * Receives a data array with format 
   * [
   *  {
   *    name: rowName,
   *    data: [value1,value2]
   *  },
   *  ...
   * ]
   */
  setData(series:seriesItem[]) {
    this._height = 500;

    this.series = series;

    return this;
  }

  nodes() {
    var nodes:nodeItem[] = [];
    var scale = d3.scaleLinear();

    _.each(this.series, (d:seriesItem) => {
      let newNode:nodeItem = {
        name:d.name,
        data:d.data,
        percentualVariation: d.data[0] ? (d.data[1]/d.data[0]-1) : 0,
        lPos:null,
        rPos:null
      };

      nodes.push(newNode);
    })

    nodes = _.sortBy(nodes, d=> -d.data[1]);

    // We calculate the aggregated variation (sum of absolute individual variations)
    // If one ite has a variation larger that 100%, we cap it to 100% (1)
    var accummulatedVariation = _.reduce(nodes, (memo,d) => {
      var stepSize =  Math.abs(d.percentualVariation)  < 1 ? Math.abs(d.percentualVariation)  : 1;
      return memo + stepSize;
    }, 0);

    // We will distribute all nodes in the available height with left/right position depending on the 
    // size of the slope 

    // Each line of text has afixed size and we will reserve this space from the height
    var itemLineSize = 12;

    var reservedSpace = (nodes.length + 1) * itemLineSize;

    // Remaining space is available for the slope/variation diagonals
    var variationSpace = this._height - reservedSpace;
    scale.range([0,variationSpace]).domain([0,accummulatedVariation]);

    var currentYPos = 0 + itemLineSize;
    _.each(nodes, d=> {

      // We start at 0 and add a step por each node depending on the percentualVariation
      // if the percentual variation is > 100% (probably a border case) we limit the step to 100%
      var stepSize = Math.abs(d.percentualVariation) < 1 ? Math.abs(d.percentualVariation) : 1;

      d.lPos = currentYPos;
      d.rPos = currentYPos;

      if (d.data[0] > d.data[1]) {
        d.rPos = d.rPos + scale(stepSize);
      } else {
        d.lPos = d.lPos + scale(stepSize);
      }
      currentYPos = _.max([d.lPos, d.rPos]) + itemLineSize;
    })

    return nodes
  }


  height(_) {
    this._height = _;

    return this;
  }


}

