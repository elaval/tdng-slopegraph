import { Component, OnInit, ElementRef, Input, SimpleChanges} from '@angular/core'; 
import * as d3 from 'd3';

import { SlopegraphLayoutService, seriesItem, nodeItem } from "./slopegraph-layout.service"

@Component({
  selector: 'app-slopegraph',
  templateUrl: './slopegraph.component.html',
  styleUrls: ['./slopegraph.component.css'],
  providers: [SlopegraphLayoutService]
})
export class SlopegraphComponent implements OnInit {
  @Input()
  series:seriesItem[];  
  
  @Input()
  categories;

  @Input()
  margin = {
    left:200,
    right:100,
    top:20,
    bottom:20
  }

  @Input()
  height = 500;

  width=500;

  svgContainer:d3.Selection<d3.BaseType, {}, null, undefined>;;  // <svg>
  mainContainer:d3.Selection<d3.BaseType, {}, null, undefined>; // Root <g> element within <svg>

  delayTime = 500;
  transitionTime = 1000;

  @Input()
  formatValues = d3.format("0.3s");

  formatVariation = d3.format("+0.1%");

  myId;

  constructor(
    private elementRef:ElementRef,
    private slopegraphLayoutService: SlopegraphLayoutService
  
  ) { }

  ngOnInit() {
    this.myId = this.guidGenerator();
    this.svgContainer = d3.select(this.elementRef.nativeElement).append("svg")
    .attr("class", "slopegraph");

    this.svgContainer
      .attr("width",this.width+this.margin.left+this.margin.right)
      .attr("height",this.height+this.margin.top+ this.margin.bottom)

    this.updateContainerSize()

    this.mainContainer = this.svgContainer.append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);   

    this.mainContainer.append("g")
      .attr("class", "items")
    
    this.mainContainer.append("text")
      .attr("class", "label left period")

    this.mainContainer.append("text")
      .attr("class", "label right period")

    // Adjust element size on window resize
    d3.select(window)
    .on("resize.slopegraph"+this.myId, () => {
      console.debug("Window resize event slopegraph "+this.myId);
      this.updateContainerSize();
      this.render(this.series);
    })

    let myNode:HTMLElement = <HTMLElement>this.svgContainer.node();
    let parentNode:HTMLElement = <HTMLElement>myNode.parentNode.parentNode;

    let parentSelect = d3.select(parentNode);
    parentSelect
    .on("resize.slopegraph"+this.myId, () => {
      console.debug("Parent resize event slopegraph "+this.myId);

      this.updateContainerSize();
      this.render(this.series);
    })

    this.render(this.series) 

      
  }

  guidGenerator() {
      var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }

  updateContainerSize() {
    let myNode:HTMLElement = <HTMLElement>this.svgContainer.node();
    let parentNode:HTMLElement = <HTMLElement>myNode.parentNode.parentNode;
    let parentStyle = getComputedStyle(parentNode);
    let paddingLeft = parseFloat(parentStyle.paddingLeft);
    let paddingRight = parseFloat(parentStyle.paddingRight);
    

    let width = parentNode.getBoundingClientRect().width-paddingLeft-paddingRight;

    //console.debug("Resize "+this.myId + " " + width + " " + paddingLeft + " " + paddingRight);


    this.width =  width - this.margin.left - this.margin.right;
    this.svgContainer
      .attr("width",this.width+this.margin.left+this.margin.right)

  }

  ngOnChanges(changes: SimpleChanges) {
    //console.debug("ngOnChanges " + this.myId, changes)
    if (this.svgContainer) this.updateContainerSize();
    this.render(this.series);
  }

  setMargin(margin) {
    if (margin.top) this.margin.top = margin.top;
    if (margin.bottom) this.margin.bottom = margin.bottom;
    if (margin.left) this.margin.left = margin.left;
    if (margin.right) this.margin.right = margin.right;

    this.updateContainerSize();
    this.render(this.series);
  }


  
  render(series) {

    if (series && series.length && this.mainContainer) {

      this.slopegraphLayoutService.setData(series).height(this.height);
      let nodes:nodeItem[] = this.slopegraphLayoutService.nodes();

      let firstPeriodLable = this.categories && this.categories[0] ? this.categories[0] : "Period 1"
      let secondPeriodLable = this.categories && this.categories[1] ? this.categories[1] : "Period 2"

      // Create / update g elements for each item
      // g.items
      //   g.item
      //     text.label
      //     g.slope
      //       text.metric.left
      //       circle.left 
      //       line
      //       circle.right 
      //       text.metric.right 


      let items = this.mainContainer.select(".items").selectAll(".item")
        .data(nodes, (d:nodeItem) => d.name);

      items.exit().remove();

      let newItems = items.enter().append("g")
        .attr("class", "item")

      // Add node label
      newItems.append("text")
        .attr("class", "label");

      // Add slope labels & circle on each side and a line linking them
      newItems.append("g")
        .attr("class", "slope");  
      
      newItems.select("g.slope").append("text")
        .attr("class", "metric left");

      newItems.select("g.slope").append("line");
      newItems.select("g.slope").append("circle")
        .attr("class","left");
      newItems.select("g.slope").append("circle")
        .attr("class","right");

      newItems.select("g.slope").append("text")
        .attr("class", "metric right");

      items = newItems    
        .merge(items);

      items
        .classed("positive", (d) => d.percentualVariation > 0)
        .classed("negative", (d) => d.percentualVariation < 0)


      // Update item labels
      items.select("text.label")
        .text(d => d.name)
        .attr("y", d => d.rPos)
        .attr("text-anchor","end")
        .attr("dy",4)
        .attr("dx",-60)
        .transition()
        .delay(this.delayTime)
        .duration(this.transitionTime)
        .attr("y", d => d.lPos ) 
        ;

      // Update slope elements
      items.select("g.slope").select("text.metric.left")
        .text(d => this.formatValues(d.data[0]))
        .attr("y", d => d.rPos)
        .attr("text-anchor","end")
        .attr("dy",4)
        .attr("dx",-10)
        .transition()
        .delay(this.delayTime)
        .duration(this.transitionTime)
        .attr("y", d => d.lPos )  
        ;


      
      items.select("g.slope").select("circle.left")
        .attr("cx", 0)
        .attr("cy", d => d.rPos)
        .attr("r", 5)
        .transition()
        .delay(this.delayTime)
        .duration(this.transitionTime)
        .attr("cy", d => d.lPos ) 
        ;

      items.select("g.slope").select("line")
        .attr("x1",0)     
        .attr("x2",this.width)
        .attr("y1", d => d.rPos )      
        .attr("y2", d => d.rPos )
        .transition()
        .delay(this.delayTime)
        .duration(this.transitionTime)
        .attr("y1", d => d.lPos )  
        ;
        
      items.select("g.slope").select("circle.right")
        .attr("cx", this.width)
        .attr("cy", d => d.rPos)
        .attr("r", 5)
        ;

      items.select("g.slope").select("text.metric.right")
        .text(d => {
          var sales = this.formatValues(d.data[1]);
          var variation = this.formatVariation(d.percentualVariation);
          return sales + " ("+variation+")";
        })
        .attr("x", this.width)
        .attr("y", d => d.rPos)
        .attr("text-anchor","start")
        .attr("dy",4)
        .attr("dx",10)
        ;

      this.mainContainer.select("text.label.left")
        .attr("dx", -10)
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor","end")
        .text(firstPeriodLable)
        ;
      
      this.mainContainer.select("text.label.right")
        .attr("dx", 10)
        .attr("y", 0)
        .attr("x", this.width)
        .text(secondPeriodLable)
        ;


    }

  }
}


