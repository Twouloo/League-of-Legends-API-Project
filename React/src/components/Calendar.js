import *  as Plot from "@observablehq/plot";
import { click } from "@testing-library/user-event/dist/click";
import * as d3 from "d3";
import { createElement as h, useRef, useEffect, useState } from "react";
import React from "react";
// Based on https://github.com/observablehq/plot/blob/main/docs/components/PlotRender.js

function sortByTime(a, b) {
  const timeA = new Date('1970-01-01 ' + a.x);
  const timeB = new Date('1970-01-01 ' + b.x);
  return timeA - timeB;
}

/* BUG: All cells show data 1 day too early. Test the halving selection algorithm, on the final halving, it might end up on the 
  wrong side.
*/

export default function Calendar(props) {

  // Use a React ref to hold a reference to the canvas element
  const plotRef = useRef(null);
  const [timesForCalendarCellKeys, setTimesForCalendarCellKeys] = useState({});

  useEffect(() => {

    const timesForCalendar = {};
    const timesForCalendarArray = [];
    const dates = [];
    const monthArr = [];

    const times = props.playerTimes;

    setTimesForCalendarCellKeys({});

    // Redundant, gives each game date a value of 1 game
    times.map((date) => {
      if (timesForCalendar[date]) {
        timesForCalendar[date].y += 1;
      }
      else timesForCalendar[date] = { y: 1 };
    });

    Object.keys(timesForCalendar).map((key) => {
      timesForCalendarArray.push({ x: key, y: timesForCalendar[key].y })
    });

    timesForCalendarArray.sort(sortByTime);

    const today = Date.now();

    // Create all dates to use for the calendar cells
    for (var i = 0; i < 98; i++) {
      dates.push({ Date: new Date(today - ((86400000) * i)), Games: 0 });
    }
    
    // Iterate through all cells for each existing game and compare if it is the same date to add to the cell.
    for (var i = 0; i < timesForCalendarArray.length; i++) {
      let l = 0; let r = dates.length - 1;

      var gameDate = new Date(timesForCalendarArray[i].x);

      while (l <= r) {
        var m = Math.floor((l + r) / 2);
        var calendarDate = dates[m].Date;
        if (
          gameDate.getFullYear() === calendarDate.getFullYear() &&
          gameDate.getMonth() === calendarDate.getMonth() &&
          gameDate.getDate() === calendarDate.getDate()
        ) {

          const dictionary = timesForCalendarCellKeys;  
          var calendar = calendarDate.getDate().toString().padStart(2, '0') + 
              "/" + (calendarDate.getMonth() + 1).toString().padStart(2, '0') + "/" + calendarDate.getFullYear();
          if(!(dictionary[calendar])) dictionary[calendar] = [];
          dictionary[calendar].push(gameDate);
          dates[m].Games += timesForCalendarArray[i].y;
          
          break;
        } else if (gameDate < calendarDate) {
          l = m + 1;
        } else {
          r = m - 1;
        }
      }

    }

    const dji = dates;

    // Configure options for calendar
    const options = {
      padding: 0,
      x: {
        axis: "top", tickSize: 0, tickFormat: (d) => {
          const month = new Date(new Date().getFullYear(), 0,
            1 + (1 - new Date(new Date().getFullYear(), 0, 1).getDay())
            + (d) * 7).toLocaleString('default', { month: 'long' });

          if (!(monthArr.includes(month))) {
            monthArr.push(month);
            return month;
          }
          return "";
        }
      },
      y: { tickFormat: Plot.formatWeekday("en", "narrow"), tickSize: 0 },
      fy: { tickFormat: "" },
      color: {
        range: (["rgb(40, 40, 40)", "white"]),
        label: "Daily change",
        tickFormat: "+%",
        domain: [0, 4],
      },
      marks: [
        Plot.cell(dji, {
          x: (d) => d3.utcWeek.count(d3.utcYear(d.Date), d.Date),
          y: (d) => d.Date.getUTCDay(),
          fill: (d, i) =>
            i > 0 ? d.Games : NaN,
          title: (d, i) =>
            i > 0
              ? d3.utcFormat("%d/%m/%Y")(d.Date) + ": " + d.Games + " games"
              : NaN,
          inset: 1,
        }),
      ],

    };

    // Create the plot and pass the canvas element from the ref
    const plot = Plot.plot(options);
    plotRef.current.appendChild(plot);

    return () => {
      // Clean up the plot when the component unmounts
      plot.remove();
    };
  }, [props.playerTimes]);


  // Handle onClick events for cells
  useEffect(() => {

    const handleDocumentClick = (event) => {
      const clickedElement = event.target;
      if (
        clickedElement.tagName === 'rect') {
        console.log(clickedElement.firstChild.textContent);

        // Set the games of the day clicked on to parent component
        if(timesForCalendarCellKeys[clickedElement.firstChild.textContent.split(":")[0]])
        props.setChosenDayArr(timesForCalendarCellKeys[clickedElement.firstChild.textContent.split(":")[0]]);
      }
    }
    const parentElement = document.getElementsByClassName('plot-d6a7b5')[0];
    parentElement.addEventListener('click', handleDocumentClick);

    return () => {
      parentElement.removeEventListener('click', handleDocumentClick);
    }
  }, [props.playerTimes])


  // Return a div element with the canvas element as a ref
  return <div ref={plotRef}></div>;
}


class Document {
  constructor() {
    this.documentElement = new Element(this, "html");
  }
  createElementNS(namespace, tagName) {
    return new Element(this, tagName);
  }
  createElement(tagName) {
    return new Element(this, tagName);
  }
  createTextNode(value) {
    return new TextNode(this, value);
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
}

class Style {
  static empty = new Style();
  setProperty() { }
  removeProperty() { }
}

class Element {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName;
    this.attributes = {};
    this.children = [];
    this.parentNode = null;
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  setAttributeNS(namespace, name, value) {
    this.setAttribute(name, value);
  }
  getAttribute(name) {
    return this.attributes[name];
  }
  getAttributeNS(name) {
    return this.getAttribute(name);
  }
  hasAttribute(name) {
    return name in this.attributes;
  }
  hasAttributeNS(name) {
    return this.hasAttribute(name);
  }
  removeAttribute(name) {
    delete this.attributes[name];
  }
  removeAttributeNS(namespace, name) {
    this.removeAttribute(name);
  }
  addEventListener() {
    // ignored; interaction needs real DOM
  }
  removeEventListener() {
    // ignored; interaction needs real DOM
  }
  dispatchEvent() {
    // ignored; interaction needs real DOM
  }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }
  insertBefore(child, after) {
    if (after == null) {
      this.children.push(child);
    } else {
      const i = this.children.indexOf(after);
      if (i < 0) throw new Error("insertBefore reference node not found");
      this.children.splice(i, 0, child);
    }
    child.parentNode = this;
    return child;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  set textContent(value) {
    this.children = [this.ownerDocument.createTextNode(value)];
  }
  set style(value) {
    this.attributes.style = value;
  }
  get style() {
    return Style.empty;
  }
  toHyperScript() {
    return h(
      this.tagName,
      this.attributes,
      this.children.map((c) => c.toHyperScript())
    );
  }
}

class TextNode {
  constructor(ownerDocument, nodeValue) {
    this.ownerDocument = ownerDocument;
    this.nodeValue = String(nodeValue);
  }
  toHyperScript() {
    return this.nodeValue;
  }
}
