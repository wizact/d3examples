var SalaryGuide = (function() {
  function SalaryGuide(fileName, title, goBackElementId) {
    this.fileName = fileName;
    this.title = title;
    this.goBackElementId = goBackElementId;
    this.draw(5000);

    document.getElementById(goBackElementId).addEventListener('click', function(e) {
          this.goBack();
      }.bind(this), false);
  };

  SalaryGuide.prototype.parent = function() {
    return document.getElementById("parent").value;
  }

  SalaryGuide.prototype.goBack = function() {
    var parent = document.getElementById("parent").value;
    this.draw(+parent);
  };

  SalaryGuide.prototype.getPreviousParent = function(data, parent) {
    var previousParent = data.filter(function(d) { return d.CategoryId === parent; });
    if (previousParent[0]) {
      return previousParent[0];
    } else {
      return Object.create({}, { Parent: { value: 5000 }, Category: { value: 'All Categories' }  });
    }
  };

  SalaryGuide.prototype.showHideBackButton = function(categoryId) {
    if (categoryId === undefined || categoryId === 5000) {
      document.getElementById(this.goBackElementId).style.display = 'none';
    } else {
      document.getElementById(this.goBackElementId).style.display = 'block';
    } 
  }

  SalaryGuide.prototype.draw = function(parent) {
    var that = this;
    d3.tsv(this.fileName, this.type, function(error, sourceData) {
      var data = sourceData.filter(function(d) { return d.Parent === parent; });
      var previousParent = that.getPreviousParent(sourceData, parent);
      document.getElementById("parent").value = previousParent.Parent;

      that.showHideBackButton(previousParent.CategoryId);

      var margin = {top: 60, right: 50, bottom: 125, left: 50},
      width = 936 - margin.left - margin.right,
      height = 550 - margin.top - margin.bottom;

      var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
      var y = d3.scaleLinear().range([height, 0]);

      var xAxis = d3.axisBottom(x);
      var yAxis = d3.axisLeft(y);

      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
          return "Max: " + d.Max + "<br/>" + "Median: " + d.Median + "<br/>" + "Min: " + d.Min + "<br/>";
        });

      var xDomain = function(data) { return data.map(function(d) { return d.Category; }); },
          yDomain = function(data) { return [0, d3.max(data, function(d) { return d.Max; })]; },
          categryMap = function(data) { return x(data.Category) + (x.bandwidth() - 26)/2; },
          maxMap = function(data) { return y(data.Max); },
          medianMap = function(data) { return y(data.Median); },
          barHeight = function(data) { return (height - y(data.Max)) - (height - y(data.Min)); },
          medianBarHeight = function(data) { return (5); },
          drillDown = function(d) {
              if (!d.Leaf) {
                tip.hide();
                that.draw(d.CategoryId); 
              } 
            };

      x.domain(xDomain(data));
      y.domain(yDomain(data));

      d3.select('.chart').select('g').remove();

      var chartWidth = width + margin.left + margin.right;
      var chartHeight = height + margin.top + margin.bottom;

        var chart = d3.select('.chart')
            .attr('viewBox', '0 0 ' + chartWidth + ' ' + chartHeight)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
          
        chart.call(tip);

        chart.append("text")
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "16px")
            .style("text-decoration", "none")
            .text(that.title + ' - ' + previousParent.Category);

        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "start")    
            .attr("y", 0)
            .attr("x", 7)
            .attr("transform" , "rotate(45)");

        var yAxisG = chart.append("g")
                .attr("class", "y axis")
                .call(yAxis);
            yAxisG.selectAll("text")
              .attr("dx", "-1.71em");
            yAxisG.append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("Salary ($NZD)");

        var g = chart.selectAll(".bar")
            .data(data)
            .enter()
            .append("g");

        g.append("rect")
            .attr("class", function(d) { return d.Leaf ? 'bar' : 'bar hand-cursor'; })
            .attr("x", categryMap)
            .attr("y", maxMap)
            .attr("height", 0)
            .attr("height", barHeight)
            .on('click', function(d) { return drillDown(d); })
            .attr("width", 0)
            .transition()
            .delay(function (d, i) {
              return i * 25;
            })
              .attr('width', 26);

        g.append("rect")
            .attr("class", function(d) { return d.Leaf ? 'medianBar' : 'medianBar hand-cursor'; })
            .attr("x", categryMap)
            .attr("y", medianMap)
            .attr("height", medianBarHeight)
            .on('click', function(d) { return drillDown(d); })
            .transition()
            .duration(200)
            .delay(function (d, i) {
              return i * 25;
            })
            .attr("width", 0)
            .transition()
            .delay(function (d, i) {
              return i * 25;
            })
            .attr('width', 26);

        g.on('mouseover', tip.show);
        g.on('mouseout', tip.hide);
    });
  }

  SalaryGuide.prototype.type = function(d) {
    d.Median = +d.Median;
    d.Min = +d.Min;
    d.Max = +d.Max;
    d.Parent = +d.Parent
    d.CategoryId = +d.CategoryId
    d.Leaf = d.Leaf === 'true'
    return d;
  }

  return SalaryGuide;
}());