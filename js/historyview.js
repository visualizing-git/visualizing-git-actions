define(['d3'], function() {
  "use strict";

  /**
   * @param {Function} fn 
   * @returns {Function}
   */
  var logMiddleware = function(fn, name) {
    return function(...args) {
      let returnValue = fn.apply(this, args);
      console.log(name || fn.name, args, returnValue);
      return returnValue;
    }
  };

  var REG_MARKER_END = 'url(#triangle)',
    MERGE_MARKER_END = 'url(#brown-triangle)',
    FADED_MARKER_END = 'url(#faded-triangle)',

    preventOverlap,
    applyBranchlessClass,
    cx, cy, fixCirclePosition,
    px1, py1, fixPointerStartPosition,
    px2, py2, fixPointerEndPosition,
    fixIdPosition, tagY, getUniqueSetItems;

  preventOverlap = logMiddleware(function preventOverlap(commit, view) {
    var commitData = view.commitData,
      baseLine = view.baseLine,
      shift = view.commitRadius * 4.5,
      overlapped = null;

    for (var i = 0; i < commitData.length; i++) {
      var c = commitData[i];
      if (c.cx === commit.cx && c.cy === commit.cy && c !== commit) {
        overlapped = c;
        break;
      }
    }

    if (overlapped) {
      var oParent = view.getCommit(overlapped.parent),
        parent = view.getCommit(commit.parent);

      if (overlapped.cy < baseLine) {
        overlapped = oParent.cy < parent.cy ? overlapped : commit;
        overlapped.cy -= shift;
      } else {
        overlapped = oParent.cy > parent.cy ? overlapped : commit;
        overlapped.cy += shift;
      }

      preventOverlap(overlapped, view);
    }
  });

  applyBranchlessClass = logMiddleware(function(selection) {
    if (selection.empty()) {
      return;
    }

    selection.classed('branchless', function(d) {
      return d.branchless;
    });

    if (selection.classed('commit-pointer')) {
      selection.attr('marker-end', function(d) {
        return d.branchless ? FADED_MARKER_END : REG_MARKER_END;
      });
    } else if (selection.classed('merge-pointer')) {
      selection.attr('marker-end', function(d) {
        return d.branchless ? FADED_MARKER_END : MERGE_MARKER_END;
      });
    }
  }, 'applyBranchlessClass');

  cx = logMiddleware(function(commit, view) {
    var parent = view.getCommit(commit.parent),
      parentCX = parent.cx;

    if (typeof commit.parent2 === 'string') {
      var parent2 = view.getCommit(commit.parent2);

      parentCX = parent.cx > parent2.cx ? parent.cx : parent2.cx;
    }

    return parentCX + (view.commitRadius * 4.5);
  }, 'cx');

  cy = logMiddleware(function(commit, view) {
    var parent = view.getCommit(commit.parent),
      parentCY = parent.cy || cy(parent, view),
      baseLine = view.baseLine,
      shift = view.commitRadius * 4.5,
      branches = [], // count the existing branches
      branchIndex = 0;

    for (var i = 0; i < view.commitData.length; i++) {
      var d = view.commitData[i];

      if (d.parent === commit.parent) {
        branches.push(d.id);
      }
    }

    branchIndex = branches.indexOf(commit.id);

    if (commit.isNoFFBranch === true) {
      branchIndex++;
    }
    if (commit.isNoFFCommit === true) {
      branchIndex--;
    }

    if (parentCY === baseLine) {
      var direction = 1;
      for (var bi = 0; bi < branchIndex; bi++) {
        direction *= -1;
      }

      shift *= Math.ceil(branchIndex / 2);

      return parentCY + (shift * direction);
    }

    if (parentCY < baseLine) {
      return parentCY - (shift * branchIndex);
    } else if (parentCY > baseLine) {
      return parentCY + (shift * branchIndex);
    }
  }, 'cy');

  fixCirclePosition = logMiddleware(function(selection) {
    selection
      .attr('cx', function(d) {
        return d.cx;
      })
      .attr('cy', function(d) {
        return d.cy;
      });
  }, 'fixCirclePosition');

  // calculates the x1 point for commit pointer lines
  px1 = logMiddleware(function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      startCX = commit.cx,
      diffX = startCX - parent.cx,
      diffY = parent.cy - commit.cy,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return startCX - (view.pointerMargin * (diffX / length));
  }, 'px1');

  // calculates the y1 point for commit pointer lines
  py1 = logMiddleware(function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      startCY = commit.cy,
      diffX = commit.cx - parent.cx,
      diffY = parent.cy - startCY,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return startCY + (view.pointerMargin * (diffY / length));
  }, 'py1');

  fixPointerStartPosition = logMiddleware(function(selection, view) {
    selection.attr('x1', function(d) {
      return px1(d, view);
    }).attr('y1', function(d) {
      return py1(d, view);
    });
  }, 'fixPointerStartPosition');

  px2 = logMiddleware(function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      endCX = parent.cx,
      diffX = commit.cx - endCX,
      diffY = parent.cy - commit.cy,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return endCX + (view.pointerMargin * 1.2 * (diffX / length));
  }, 'px2');

  py2 = logMiddleware(function(commit, view, pp) {
    pp = pp || 'parent';

    var parent = view.getCommit(commit[pp]),
      endCY = parent.cy,
      diffX = commit.cx - parent.cx,
      diffY = endCY - commit.cy,
      length = Math.sqrt((diffX * diffX) + (diffY * diffY));

    return endCY - (view.pointerMargin * 1.2 * (diffY / length));
  }, 'py2');

  fixPointerEndPosition = logMiddleware(function(selection, view) {
    selection.attr('x2', function(d) {
      return px2(d, view);
    }).attr('y2', function(d) {
      return py2(d, view);
    });
  }, 'fixPointerEndPosition');

  fixIdPosition = logMiddleware(function(selection, view, delta) {
    selection.attr('x', function(d) {
      return d.cx;
    }).attr('y', function(d) {
      return d.cy + view.commitRadius + delta;
    });
  }, 'fixIdPosition');

  tagY = logMiddleware(function tagY(t, view) {
    var commit = view.getCommit(t.commit),
      commitCY = commit.cy,
      tags = commit.tags,
      tagIndex = tags.indexOf(t.name);

    if (tagIndex === -1) {
      tagIndex = tags.length;
    }

    if (commitCY < (view.baseLine)) {
      return commitCY - 45 - (tagIndex * 25);
    } else {
      return commitCY + 50 + (tagIndex * 25);
    }
  }, 'tagY');

  getUniqueSetItems = logMiddleware(function(set1, set2) {
    var uniqueSet1 = JSON.parse(JSON.stringify(set1))
    var uniqueSet2 = JSON.parse(JSON.stringify(set2))
    for (var id in set1) {
      delete uniqueSet2[id]
    }
    for (var id in set2) {
      delete uniqueSet1[id]
    }
    return [uniqueSet1, uniqueSet2]
  }, 'getUniqueSetItems');

  /**
   * @class HistoryView
   * @constructor
   */
  function HistoryView(config) {
    var commitData = config.commitData || [],
      commit, branch;

    this.branches = [];
    for (var i = 0; i < commitData.length; i++) {
      commit = commitData[i];
      !commit.parent && (commit.parent = 'initial');
      !commit.tags && (commit.tags = []);
      for (var j = 0; j < commit.tags.length; j++) {
        branch = commit.tags[j]
        if (branch.indexOf('[') !== 0 && this.branches.indexOf(branch) === -1) {
          this.branches.push(branch)
        }
      }
    }

    this.name = config.name || 'UnnamedHistoryView';
    this.commitData = commitData;

    this.currentBranch = config.currentBranch || 'main';

    this.width = config.width;
    this.height = config.height || 400;
    this.orginalBaseLine = config.baseLine;
    this.baseLine = this.height * (config.baseLine || 0.9);

    this.commitRadius = config.commitRadius || 20;
    this.pointerMargin = this.commitRadius * 1.3;

    this.isRemote = typeof config.remoteName === 'string';
    this.remoteName = config.remoteName;

    this.logs = {}

    this.initialCommit = {
      id: 'initial',
      parent: null,
      cx: -(this.commitRadius * 2),
      cy: this.baseLine
    };

    this.locks = 0
    this._eventCallbacks = {}

    if (config.savedState) {
      setTimeout(function() {
        this.deserialize(config.savedState)
      }.bind(this))
    }
  }

  HistoryView.generateId = function() {
    return Math.floor((1 + Math.random()) * 0x10000000).toString(16).substring(1);
  };

  HistoryView.prototype = {
    serialize: logMiddleware(function () {
      var data = {
        commitData: this.commitData,
        branches: this.branches,
        logs: this.logs,
        currentBranch: this.currentBranch,
      }

      return JSON.stringify(data)
    }, 'serialize'),

    deserialize: logMiddleware(function (data) {
      data = JSON.parse(data)
      if (data) {
        this.commitData = data.commitData
        this.branches = data.branches
        this.logs = data.logs
        this._setCurrentBranch(data.currentBranch || null)
        this.renderCommits()
        this.renderTags()
      }
    }, 'deserialize'),

    emit: logMiddleware(function (event) {
      var callbacks = this._eventCallbacks[event] || []
      callbacks.forEach(function(callback) {
        try {
          callback(event)
        } finally {
          // nothing
        }
      })
    }, 'emit'),

    on: logMiddleware(function (event, callback) {
      var callbacks = this._eventCallbacks[event] || []
      callbacks.push(callback)
      this._eventCallbacks[event] = callbacks

      return function () {
        var cbs = this._eventCallbacks[event] || []
        var idx = cbs.indexOf(callback)
        if (idx > -1) {
          cbs.splice(idx, 1)
          this._eventCallbacks[event] = cbs
        }
      }.bind(this)
    }, 'on'),

    lock: logMiddleware(function () {
      this.locks++
      if (this.locks === 1) {
        this.emit('lock')
      }
    }, 'lock'),

    unlock: logMiddleware(function () {
      if (this.locks <= 0) {
        throw new Error('cannot unlock! not locked')
      }

      this.locks--
      if (this.locks === 0) {
        this.emit('unlock')
      }
    }, 'unlock'),

    /**
     * @method getCommit
     * @param ref {String} the id or a tag name that refers to the commit
     * @return {Object} the commit datum object
     */
    getCommit: logMiddleware(function getCommit(ref) {
      // Optimization, doesn't seem to break anything
      if (!ref) return null;
      if (ref.id) return ref

      var commitData = this.commitData,
        matchedCommit = null;

      var reflogMatch
      if (reflogMatch = ref.match(/^(.*)@\{(\d+)\}(.*)$/)) {
        var branchName = reflogMatch[1].toLowerCase()
        var count = parseInt(reflogMatch[2], 10)
        var rest = reflogMatch[3]

        if (this.logs[branchName] && this.logs[branchName][count]) {
          ref = this.logs[branchName][count].destination + rest
        }
      }

      var parts = /^([^\^\~]+)(.*)$/.exec(ref),
        ref = parts[1],
        modifier = parts[2];

      if (ref === 'initial') {
        return this.initialCommit;
      }

      if (ref.toLowerCase() === 'head') {
        ref = 'HEAD';
      }

      var commitsThatStartWith = commitData
        .filter(function(c) {
          return c.id.indexOf(ref) === 0
        })

      if (commitsThatStartWith.length === 1) {
        matchedCommit = commitsThatStartWith[0]
      } else if (commitsThatStartWith.length > 1) {
        throw new Error("Ref " + ref + " is ambiguous")
      }

      for (var i = 0; i < commitData.length; i++) {
        var commit = commitData[i];
        if (commit === ref) {
          matchedCommit = commit;
          break;
        }

        if (commit.id === ref) {
          matchedCommit = commit;
          break;
        }

        var matchedTag = function() {
          for (var j = 0; j < commit.tags.length; j++) {
            var tag = commit.tags[j];
            if (tag === ref) {
              matchedCommit = commit;
              return true;
            }

            if (tag.indexOf('[') === 0 && tag.indexOf(']') === tag.length - 1) {
              tag = tag.substring(1, tag.length - 1);
            }
            if (tag === ref) {
              matchedCommit = commit;
              return true;
            }
          }
        }();
        if (matchedTag === true) {
          break;
        }
      }

      if (matchedCommit && modifier) {
        while (modifier) {
          var nextToken = modifier[0]
          modifier = modifier.substr(1)
          var amountMatch = modifier.match(/^(\d+)(.*)$/),
            amount = 1;

          if (amountMatch) {
            var amount = ~~amountMatch[1]
          }

          if (nextToken === '^') {
            if (amount === 0) {
              /* do nothing, refers to this commit */
            } else if (amount === 1) {
              matchedCommit = this.getCommit(matchedCommit.parent)
            } else if (amount === 2) {
              matchedCommit = this.getCommit(matchedCommit.parent2)
            } else {
              matchedCommit = null
            }
          } else if (nextToken === '~') {
            for (var i = 0; i < amount; i++) {
              if (matchedCommit && matchedCommit.parent) {
                matchedCommit = this.getCommit(matchedCommit.parent)
              }
            }
          }
        }
      }

      return matchedCommit;
    }, 'getCommit'),

    revparse: logMiddleware(function(refspec) {
      var commit
      if (commit = this.getCommit(refspec)) {
        return commit.id
      } else {
        throw new Error("Cannot find object from refspec " + refspec)
      }
    }, 'revparse'),

    /**
     * @method getCircle
     * @param ref {String} the id or a tag name that refers to the commit
     * @return {d3 Selection} the d3 selected SVG circle
     */
    getCircle: logMiddleware(function(ref) {
      var circle = this.svg.select('#' + this.name + '-' + ref),
        commit;

      if (circle && !circle.empty()) {
        return circle;
      }

      commit = this.getCommit(ref);

      if (!commit) {
        return null;
      }

      return this.svg.select('#' + this.name + '-' + commit.id);
    }, 'getCircle'),

    getCircles: logMiddleware(function() {
      return this.svg.selectAll('circle.commit');
    }, 'getCircles'),

    /**
     * @method render
     * @param container {String} selector for the container to render the SVG into
     */
    render: logMiddleware(function(container) {
      var svgContainer, svg;

      svgContainer = container.append('div')
        .classed('svg-container', true)
        .classed('remote-container', this.isRemote);

      if (this.isRemote) {
        $(svgContainer).draggable();
      }

      svg = svgContainer.append('svg:svg');

      svg.attr('id', this.name)
        .attr('width', this.width)
        .attr('height', this.isRemote ? this.height + 150 : this.height);

      if (this.isRemote) {
        svg.append('svg:text')
          .classed('remote-name-display', true)
          .text(this.remoteName)
          .attr('x', 10)
          .attr('y', 25);
      } else {
        svg.append('svg:text')
          .classed('remote-name-display', true)
          .text('Local Repository')
          .attr('x', 10)
          .attr('y', 25);

        svg.append('svg:text')
          .classed('current-branch-display', true)
          .attr('x', 10)
          .attr('y', 45);
      }

      this.svgContainer = svgContainer;
      this.svg = svg;
      this.arrowBox = svg.append('svg:g').classed('pointers', true);
      this.commitBox = svg.append('svg:g').classed('commits', true);
      this.tagBox = svg.append('svg:g').classed('tags', true);

      this.renderCommits();

      this._setCurrentBranch(this.currentBranch);
    }, 'render'),

    destroy: logMiddleware(function() {
      this.svg.remove();
      this.svgContainer.remove();
      clearInterval(this.refreshSizeTimer);

      for (var prop in this) {
        if (this.hasOwnProperty(prop)) {
          this[prop] = null;
        }
      }
    }, 'destroy'),

    _calculatePositionData: logMiddleware(function() {
      for (var i = 0; i < this.commitData.length; i++) {
        var commit = this.commitData[i];
        commit.cx = cx(commit, this);
        commit.cy = cy(commit, this);
        preventOverlap(commit, this);
      }
    }, '_calculatePositionData'),

    _resizeSvg: logMiddleware(function() {
      var ele = document.getElementById(this.svg.node().id);
      var container = ele.parentNode;
      var currentWidth = ele.offsetWidth;
      var newWidth;

      if (ele.getBBox().width > container.offsetWidth)
        newWidth = Math.round(ele.getBBox().width);
      else
        newWidth = container.offsetWidth - 5;

      if (currentWidth != newWidth) {
        this.svg.attr('width', newWidth);
        container.scrollLeft = container.scrollWidth;
      }
    }, '_resizeSvg'),

    renderCommits: logMiddleware(function() {
      if (typeof this.height === 'string' && this.height.indexOf('%') >= 0) {
        var perc = this.height.substring(0, this.height.length - 1) / 100.0;
        var baseLineCalcHeight = Math.round(this.svg.node().parentNode.offsetHeight * perc) - 65;
        var newBaseLine = Math.round(baseLineCalcHeight * (this.originalBaseLine || 0.6));
        if (newBaseLine !== this.baseLine) {
          this.baseLine = newBaseLine;
          this.initialCommit.cy = newBaseLine;
          this.svg.attr('height', baseLineCalcHeight);
        }
      }
      this._calculatePositionData();
      this._calculatePositionData(); // do this twice to make sure
      this._renderCircles();
      this._renderPointers();
      this._renderMergePointers();
      this._renderIdLabels();
      this._resizeSvg();
      this.currentBranch && this.checkout(this.currentBranch);
    }, 'renderCommits'),

    _renderCircles: logMiddleware(function() {
      var view = this,
        existingCircles,
        newCircles;

      existingCircles = this.commitBox.selectAll('circle.commit')
        .data(this.commitData, function(d) {
          return d.id;
        })
        .attr('id', function(d) {
          return view.name + '-' + d.id;
        })
        .classed('reverted', function(d) {
          return d.reverted || d.revertSource;
        })
        .classed('rebased', function(d) {
          return d.rebased || d.rebaseSource;
        })
        .classed('logging', function(d) {
          return d.logging;
        })
        .classed('cherry-picked', function(d) {
          return d.cherryPicked || d.cherryPickSource;
        })
        .classed('checked-out', function(d) {
          return d.tags.indexOf('HEAD') > -1
        });

      existingCircles.transition()
        .duration(500)
        .call(fixCirclePosition);

      newCircles = existingCircles.enter()
        .append('svg:circle')
        .attr('id', function(d) {
          return view.name + '-' + d.id;
        })
        .classed('commit', true)
        .classed('merge-commit', function(d) {
          return typeof d.parent2 === 'string';
        })
        .classed('rebased', function(d) {
          return d.rebased || d.rebaseSource
        })
        .classed('cherry-picked', function(d) {
          return d.cherryPicked || d.cherryPickSource;
        })
        .call(fixCirclePosition)
        .attr('r', 1)
        .transition("inflate")
        .duration(500)
        .attr('r', this.commitRadius)

      existingCircles.exit()
        .remove()

    }, '_renderCircles'),

    _renderPointers: logMiddleware(function() {
      var view = this,
        existingPointers,
        newPointers;

      existingPointers = this.arrowBox.selectAll('line.commit-pointer')
        .data(this.commitData, function(d) {
          return d.id;
        })
        .attr('id', function(d) {
          return view.name + '-' + d.id + '-to-' + d.parent;
        });

      existingPointers.transition()
        .duration(500)
        .call(fixPointerStartPosition, view)
        .call(fixPointerEndPosition, view);

      newPointers = existingPointers.enter()
        .append('svg:line')
        .filter(function(d) {
          // Don't render root commit with a pointer
          return d.parent !== 'initial';
        })
        .attr('id', function(d) {
          return view.name + '-' + d.id + '-to-' + d.parent;
        })
        .classed('commit-pointer', true)
        .call(fixPointerStartPosition, view)
        .attr('x2', function() {
          return d3.select(this).attr('x1');
        })
        .attr('y2', function() {
          return d3.select(this).attr('y1');
        })
        .attr('marker-end', REG_MARKER_END)
        .transition()
        .duration(500)
        .call(fixPointerEndPosition, view);

      existingPointers.exit()
        .remove()
    }, '_renderPointers'),

    _renderMergePointers: logMiddleware(function() {
      var view = this,
        mergeCommits = [],
        existingPointers, newPointers;

      for (var i = 0; i < this.commitData.length; i++) {
        var commit = this.commitData[i];
        if (typeof commit.parent2 === 'string') {
          mergeCommits.push(commit);
        }
      }

      existingPointers = this.arrowBox.selectAll('polyline.merge-pointer')
        .data(mergeCommits, function(d) {
          return d.id;
        })
        .attr('id', function(d) {
          return view.name + '-' + d.id + '-to-' + d.parent2;
        });

      existingPointers.transition().duration(500)
        .attr('points', function(d) {
          var p1 = px1(d, view, 'parent2') + ',' + py1(d, view, 'parent2'),
            p2 = px2(d, view, 'parent2') + ',' + py2(d, view, 'parent2');

          return [p1, p2].join(' ');
        });

      newPointers = existingPointers.enter()
        .append('svg:polyline')
        .attr('id', function(d) {
          return view.name + '-' + d.id + '-to-' + d.parent2;
        })
        .classed('merge-pointer', true)
        .attr('points', function(d) {
          var x1 = px1(d, view, 'parent2'),
            y1 = py1(d, view, 'parent2'),
            p1 = x1 + ',' + y1;

          return [p1, p1].join(' ');
        })
        .attr('marker-end', MERGE_MARKER_END)
        .transition()
        .duration(500)
        .attr('points', function(d) {
          var points = d3.select(this).attr('points').split(' '),
            x2 = px2(d, view, 'parent2'),
            y2 = py2(d, view, 'parent2');

          points[1] = x2 + ',' + y2;
          return points.join(' ');
        });

      existingPointers.exit()
        .remove()
    }, '_renderMergePointers'),

    _renderIdLabels: logMiddleware(function() {
      this._renderText('id-label', function(d) {
        return d.id + '..';
      }, 14);
      this._renderText('message-label', function(d) {
        return d.message;
      }, 24);
    }, '_renderIdLabels'),

    _renderText: logMiddleware(function(className, getText, delta) {
      var view = this,
        existingTexts,
        newtexts;

      existingTexts = this.commitBox.selectAll('text.' + className)
        .data(this.commitData, function(d) {
          return d.id;
        })
        .text(getText);

      existingTexts.transition().call(fixIdPosition, view, delta);

      newtexts = existingTexts.enter()
        .insert('svg:text', ':first-child')
        .classed(className, true)
        .text(getText)
        .call(fixIdPosition, view, delta);

      existingTexts.exit()
        .remove()
    }, '_renderText'),

    _replaceTag: logMiddleware(function (old_tag, new_tag) {
      var tagData = [],
        i,
        headCommit = null;

      for (i = 0; i < this.commitData.length; i++) {
        var c = this.commitData[i];

        for (var t = 0; t < c.tags.length; t++) {
          var tagName = c.tags[t];
          if (tagName.toUpperCase() === 'HEAD') {
            headCommit = c;
          } else if (tagName === old_tag) {
            c.tags[t] = new_tag;
            tagName = c.tags[t];
            this.branches.push(new_tag);
          }

          tagData.push({
            name: tagName,
            commit: c.id
          });
        }
      }

      if (!headCommit) {
        headCommit = this.getCommit(this.currentBranch);
        headCommit.tags.push('HEAD');
        tagData.push({
          name: 'HEAD',
          commit: headCommit.id
        });
      }

      return tagData;
    }, '_replaceTag'),

    _parseTagData: logMiddleware(function() {
      var tagData = [],
        i,
        headCommit = null;

      for (i = 0; i < this.commitData.length; i++) {
        var c = this.commitData[i];

        for (var t = 0; t < c.tags.length; t++) {
          var tagName = c.tags[t];
          if (tagName.toUpperCase() === 'HEAD') {
            headCommit = c;
          } else if (this.branches.indexOf(tagName) === -1) {
            this.branches.push(tagName);
          }

          tagData.push({
            name: tagName,
            commit: c.id
          });
        }
      }

      if (!headCommit) {
        headCommit = this.getCommit(this.currentBranch);
        headCommit.tags.push('HEAD');
        tagData.push({
          name: 'HEAD',
          commit: headCommit.id
        });
      }

      // find out which commits are not branchless


      return tagData;
    }, '_parseTagData'),

    _walkCommit: logMiddleware(function (commit) {
      commit.branchless = false
      commit.parent && this._walkCommit(this.getCommit(commit.parent))
      commit.parent2 && this._walkCommit(this.getCommit(commit.parent2))
    }, '_walkCommit'),

    _markBranchlessCommits: logMiddleware(function() {
      var branch, commit, parent, parent2, c, b;

      // first mark every commit as branchless
      for (c = 0; c < this.commitData.length; c++) {
        this.commitData[c].branchless = true;
      }

      for (b = 0; b < this.branches.length; b++) {
        branch = this.branches[b];
        if (branch.indexOf('/') === -1) {
          commit = this.getCommit(branch);
          parent = this.getCommit(commit.parent);
          parent2 = this.getCommit(commit.parent2);

          this._walkCommit(commit)
        }
      }

      this.svg.selectAll('circle.commit').call(applyBranchlessClass);
      this.svg.selectAll('line.commit-pointer').call(applyBranchlessClass);
      this.svg.selectAll('polyline.merge-pointer').call(applyBranchlessClass);
    }, '_markBranchlessCommits'),

    renderTags: logMiddleware(function() {
      var view = this,
        tagData = this._parseTagData(),
        existingTags, newTags;

      existingTags = this.tagBox.selectAll('g.branch-tag')
        .data(tagData, function(d) {
          return d.name;
        });

      existingTags.exit().remove();

      existingTags.select('rect')
        .transition()
        .duration(500)
        .attr('y', function(d) {
          return tagY(d, view);
        })
        .attr('x', function(d) {
          var commit = view.getCommit(d.commit),
            width = Number(d3.select(this).attr('width'));

          return commit.cx - (width / 2);
        });

      existingTags.select('text')
        .transition()
        .duration(500)
        .attr('y', function(d) {
          return tagY(d, view) + 14;
        })
        .attr('x', function(d) {
          var commit = view.getCommit(d.commit);
          return commit.cx;
        });

      newTags = existingTags.enter()
        .append('g')
        .attr('class', function(d) {
          var classes = 'branch-tag';
          if (d.name.indexOf('[') === 0 && d.name.indexOf(']') === d.name.length - 1) {
            classes += ' git-tag';
          } else if (d.name.indexOf('/') >= 0) {
            classes += ' remote-branch';
          } else if (d.name.toUpperCase() === 'HEAD') {
            classes += ' head-tag';
          }
          return classes;
        });

      newTags.append('svg:rect')
        .attr('width', function(d) {
          return (d.name.length * 8) + 20;
        })
        .attr('height', 20)
        .attr('y', function(d) {
          return tagY(d, view);
        })
        .attr('x', function(d) {
          var commit = view.getCommit(d.commit),
            width = Number(d3.select(this).attr('width'));

          return commit.cx - (width / 2);
        });

      newTags.append('svg:text')
        .text(function(d) {
          if (d.name.indexOf('[') === 0 && d.name.indexOf(']') === d.name.length - 1)
            return d.name.substring(1, d.name.length - 1);
          return d.name;
        })
        .attr('y', function(d) {
          return tagY(d, view) + 14;
        })
        .attr('x', function(d) {
          var commit = view.getCommit(d.commit);
          return commit.cx;
        });

      existingTags.exit()
        .remove()

      this._markBranchlessCommits();
    }, 'renderTags'),

    _setCurrentBranch: logMiddleware(function(branch) {
      var display = this.svg.select('text.current-branch-display'),
        text = 'HEAD: ';

      if (branch && branch.indexOf('/') === -1) {
        text += branch;
        this.currentBranch = branch;
      } else {
        text += ' (detached head)';
        this.currentBranch = null;
      }

      display.text(text);
    }, '_setCurrentBranch'),

    addReflogEntry: logMiddleware(function(ref, destination, reason) {
      ref = ref.toLowerCase()
      this.logs[ref] = this.logs[ref] || []
      this.logs[ref].unshift({
        destination: destination,
        reason: reason
      })
    }, 'addReflogEntry'),

    getReflogEntries: logMiddleware(function(ref) {
      if (!this.logs[ref.toLowerCase()]) {
        throw new Error("no reflog for " + ref)
      }

      return this.logs[ref.toLowerCase()].map(function(entry, idx) {
        return entry.destination + " " + ref + "@{" + idx + "} " + " " + entry.reason
      })
    }, 'getReflogEntries'),

    moveTag: logMiddleware(function(tag, ref) {
      var currentLoc = this.getCommit(tag),
        newLoc = this.getCommit(ref);

      if (currentLoc) {
        currentLoc.tags.splice(currentLoc.tags.indexOf(tag), 1);
      }

      newLoc.tags.push(tag);
      return this;
    }, 'moveTag'),

    amendCommit: logMiddleware(function(message) {
      this.commit({parent: this.getCommit('head^').id}, message)
    }, 'amendCommit'),

    commit: logMiddleware(function(commit, message) {
      commit = commit || {};

      !commit.id && (commit.id = HistoryView.generateId());
      !commit.tags && (commit.tags = []);

      commit.message = message
      if (!commit.parent) {
        commit.parent = this.getCommit('HEAD').id;
      }

      this.commitData.push(commit);
      if (this.currentBranch) {
        this.moveTag(this.currentBranch, commit.id);
      }

      this.renderCommits();

      if (this.currentBranch) {
        this.checkout(this.currentBranch);
      } else {
        this.checkout(commit.id)
      }
      return this;
    }, 'commit'),

    getLogEntries: logMiddleware(function(refspec) {
      var ancestors = this.getAncestorSet(refspec)
      delete ancestors.initial
      ancestors[refspec] = -1
      var commitIds = Object.keys(ancestors)
      this.lock()
      this.flashProperty(commitIds, 'logging', null, this.unlock)
      return commitIds.map(function(commitId) {
        return {commit: this.getCommit(commitId), order: ancestors[commitId]}
      }, this).sort(function(a,b) {
        return a.order - b.order
      }).map(function(commitInfo) {
          var commit = commitInfo.commit
          return commit.id + ' ' + (commit.message || "(no message)")
        }, this)
    }, 'getLogEntries'),

    setProperty: logMiddleware(function(refs, property) {
      refs.forEach(function(ref) {
        this.getCommit(ref)[property] = true
      }, this)
    }, 'setProperty'),

    unsetProperty: logMiddleware(function(refs, property) {
      refs.forEach(function(ref) {
        var commit = this.getCommit(ref)
        delete commit[property]
      }, this)
    }, 'unsetProperty'),

    cherryPick: logMiddleware(function(refs, mainline) {
      refs.forEach(function(ref) {
        if (!this.getCommit(ref)) {
          throw new Error("fatal: bad revision '" + ref + "'")
          return
        }
      }, this)

      if (mainline) {
        if (mainline > 2 || mainline < 1) {
          throw new Error("Commit " + refs[0] + " does not have parent " + mainline)
          return
        }
        var nonMergeRefs = refs.filter(function(ref) {
          var commit = this.getCommit(ref)
          return !commit.parent || !commit.parent2
        }, this)

        if (nonMergeRefs.length) {
          throw new Error('mainline specified but ' + nonMergeRefs[0] + ' is not a merge')
        }
      } else {
        var mergeRefs = refs.filter(function(ref) {
          var commit = this.getCommit(ref)
          return commit.parent && commit.parent2
        }, this)

        if (mergeRefs.length) {
          throw new Error('cannot cherry-pick merge commit ' + mergeRefs[0] + ' without specifying a mainline with -m')
        }
      }

      if (!mainline) {
        refs.forEach(function(ref) {
          var commit = this.getCommit(ref)
          var message = commit.message || ""
          this.lock()
          this.flashProperty([commit.id], 'cherryPicked', function() {
            this.commit({cherryPickSource: [commit.id]}, message)
            var reflogMessage = "cherry-pick: " + message
            this.addReflogEntry(
              'HEAD', this.getCommit('HEAD').id, reflogMessage
            )
            if (this.currentBranch) {
              this.addReflogEntry(
                this.currentBranch, this.getCommit('HEAD').id, reflogMessage
              )
            }
          }, this.unlock)
        }, this)
      } else {
        refs.forEach(function(ref) {
          var commit = this.getCommit(ref)
          var message = commit.message || ""
          var cherryPickSource = this.getNonMainlineCommits(commit.id, mainline)

          this.lock()
          this.flashProperty(cherryPickSource, 'cherryPicked', function() {
            this.commit({cherryPickSource: cherryPickSource}, message)
            var reflogMessage = "cherry-pick: " + message
            this.addReflogEntry(
              'HEAD', this.getCommit('HEAD').id, reflogMessage
            )
            if (this.currentBranch) {
              this.addReflogEntry(
                this.currentBranch, this.getCommit('HEAD').id, reflogMessage
              )
            }
          }, this.unlock)
        }, this)
      }
    }, 'cherryPick'),

    getNonMainlineCommits: logMiddleware(function(ref, mainline) {
      if (mainline === 1) mainline = 2
      else if (mainline === 2) mainline = 1
      else throw new Error("Mainline " + mainline + " isn't supported")
      var ancestor1Set = this.getAncestorSet(ref, 1)
      var ancestor2Set = this.getAncestorSet(ref, 2)
      var uniqueAncestors = getUniqueSetItems(ancestor1Set, ancestor2Set)
      return Object.keys(uniqueAncestors[mainline-1]).concat(ref)
    }, 'getNonMainlineCommits'),

    flashProperty: logMiddleware(function(refs, property, callback, callback2) {
      this.setProperty(refs, property)
      this.renderCommits()
      setTimeout(function() {
        callback && callback.call(this)
        setTimeout(function() {
          this.unsetProperty(refs, property)
          this.renderCommits()
          callback2 && callback2.call(this)
        }.bind(this), 500)
      }.bind(this), 1000)
    }, 'flashProperty'),

    getParents: logMiddleware(function(ref, mainline) {
      var commit,
        parents = []
      if (ref.id) {
        commit = ref
      } else {
        commit = this.getCommit(ref)
      }
      if ((!mainline || mainline === 1) && commit.parent) parents.push(commit.parent)
      if ((!mainline || mainline === 2) && commit.parent2) parents.push(commit.parent2)
      return parents
    }, 'getParents'),

    getAncestorSet: logMiddleware(function(ref, mainline) {
      var ancestors = {}
      var i = 1;
      function getAncestor(currentRef, currentMainline) {
        var parents = this.getParents(currentRef, currentMainline)
        parents.forEach(function(parentRef) {
          ancestors[parentRef] = i++
          getAncestor.call(this, parentRef)
        }, this)
      }
      getAncestor.call(this, ref, mainline)
      return ancestors
    }, 'getAncestorSet'),

    getBranchList: logMiddleware(function() {
      return this.commitData.reduce(function(acc, commit) {
        return acc.concat(commit.tags.filter(function(tag) {
          return !tag.match(/^\[.*\]$/) && tag !== 'HEAD'
        }))
      }, []).map(function(tag) {
        if (this.currentBranch && (tag.toLowerCase() === this.currentBranch.toLowerCase())) {
          return '* ' + tag
        } else {
          return '&nbsp; ' + tag
        }
      }, this)
    }, 'getBranchList'),

    branch: logMiddleware(function(name, startCommit) {
      if (!name || name.trim() === '') {
        throw new Error('You need to give a branch name.');
      }

      if (name === 'HEAD') {
        throw new Error('You cannot name your branch "HEAD".');
      }

      if (this.branches.indexOf(name) > -1) {
        throw new Error('Branch "' + name + '" already exists.');
      }

      var startPoint = this.getCommit(startCommit || 'head')
      if (!startPoint) {
        throw new Error("fatal: Not a valid object name:'" + startCommit + "'")
      }
      startPoint.tags.push(name);
      this.renderTags();
      return this;
    }, 'branch'),

    tag: logMiddleware(function(name) {
      this.branch('[' + name + ']');
    }, 'tag'),

    deleteBranch: logMiddleware(function(name) {
      var branchIndex,
        commit;

      if (!name || name.trim() === '') {
        throw new Error('You need to give a branch name.');
      }

      if (name === this.currentBranch) {
        throw new Error('Cannot delete the currently checked-out branch.');
      }

      branchIndex = this.branches.indexOf(name);

      if (branchIndex === -1) {
        throw new Error('That branch doesn\'t exist.');
      }

      this.branches.splice(branchIndex, 1);
      commit = this.getCommit(name);
      delete this.logs[name]
      branchIndex = commit.tags.indexOf(name);

      if (branchIndex > -1) {
        commit.tags.splice(branchIndex, 1);
      }

      this.renderTags();
    }, 'deleteBranch'),

    renameCheckedOutBranch: logMiddleware(function(new_name) {
      if (!new_name || new_name.trim() === '') {
        throw new Error('You need to give a new branch name.');
      }

      if (this.branches.includes(new_name)) {
        throw new Error('That branch already exists.');
      }

      let old_name = this.currentBranch;
      this._replaceTag(old_name, new_name);
      let branch_index = this.branches.indexOf(old_name);
      this.branches[branch_index] = new_name;
      this.logs[new_name] = this.logs[old_name];
      delete this.logs[old_name];

      this._setCurrentBranch(new_name);
      this.renderTags();
    }, 'renameCheckedOutBranch'),

    checkout: logMiddleware(function(ref) {
      var commit = this.getCommit(ref);

      if (!commit) {
        throw new Error('Cannot find commit: ' + ref);
      }

      var previousHead = this.getCircle('HEAD'),
        newHead = this.getCircle(commit.id);

      if (previousHead && !previousHead.empty()) {
        previousHead.classed('checked-out', false);
      }

      var isBranch = this.branches.indexOf(ref) !== -1
      this._setCurrentBranch(isBranch ? ref : null);
      this.moveTag('HEAD', commit.id);
      this.renderTags();

      newHead.classed('checked-out', true);

      return this;
    }, 'checkout'),

    reset: logMiddleware(function(ref) {
      var commit = this.getCommit(ref);

      if (!commit) {
        throw new Error('Cannot find ref: ' + ref);
      }

      if (this.currentBranch) {
        this.moveTag(this.currentBranch, commit.id);
        this.checkout(this.currentBranch);
      } else {
        this.checkout(commit.id);
      }

      return this;
    }, 'reset'),

    revert: logMiddleware(function(refs, mainline) {
      refs.forEach(function(ref) {
        if (!this.getCommit(ref)) {
          throw new Error("fatal: bad revision '" + ref + "'")
          return
        }
      }, this)

      if (mainline) {
        if (mainline > 2 || mainline < 1) {
          throw new Error("Commit " + refs[0] + " does not have parent " + mainline)
          return
        }
        var nonMergeRefs = refs.filter(function(ref) {
          var commit = this.getCommit(ref)
          return !commit.parent || !commit.parent2
        }, this)

        if (nonMergeRefs.length) {
          throw new Error('mainline specified but ' + nonMergeRefs[0] + ' is not a merge')
        }
      } else {
        var mergeRefs = refs.filter(function(ref) {
          var commit = this.getCommit(ref)
          return commit.parent && commit.parent2
        }, this)

        if (mergeRefs.length) {
          throw new Error('cannot revert merge commit ' + mergeRefs[0] + ' without specifying a mainline with -m')
        }
      }

      if (!mainline) {
        refs.forEach(function(ref) {
          var commit = this.getCommit(ref)
          var message = commit.message || ""
          this.lock()
          this.flashProperty([commit.id], 'reverted', function() {
            this.commit({revertSource: [commit.id]}, "Revert " + commit.id)
            var reflogMessage = "revert: " + message
            this.addReflogEntry(
              'HEAD', this.getCommit('HEAD').id, reflogMessage
            )
            if (this.currentBranch) {
              this.addReflogEntry(
                this.currentBranch, this.getCommit('HEAD').id, reflogMessage
              )
            }
          }, this.unlock)
        }, this)
      } else {
        refs.forEach(function(ref) {
          var commit = this.getCommit(ref)
          var message = commit.message || ""
          var revertSource = this.getNonMainlineCommits(commit.id, mainline)

          this.lock()
          this.flashProperty(revertSource, 'reverted', function() {
            this.commit({revertSource: revertSource}, "Revert " + commit.id)
            var reflogMessage = "revert: " + message
            this.addReflogEntry(
              'HEAD', this.getCommit('HEAD').id, reflogMessage
            )
            if (this.currentBranch) {
              this.addReflogEntry(
                this.currentBranch, this.getCommit('HEAD').id, reflogMessage
              )
            }
          }, this.unlock)
        }, this)
      }
    }, 'revert'),

    fastForward: logMiddleware(function(ref) {
      var targetCommit = this.getCommit(ref);

      if (this.currentBranch) {
        this.moveTag(this.currentBranch, targetCommit.id);
        this.checkout(this.currentBranch);
      } else {
        this.checkout(targetCommit.id);
      }
    }, 'fastForward'),

    isAncestorOf: logMiddleware(function(search, start) {
      var startCommit = this.getCommit(start),
        searchCommit = this.getCommit(search)

      if (!searchCommit) {
        return false
      }

      if (startCommit === searchCommit) {
        return true
      } else {
        var ancestorOnFirstParent = startCommit.parent && this.isAncestorOf(searchCommit.id, startCommit.parent)
        var ancestorOnSecondParent = startCommit.parent2 && this.isAncestorOf(searchCommit.id, startCommit.parent2)
        return ancestorOnFirstParent || ancestorOnSecondParent
      }
    }, 'isAncestorOf'),

    walkAncestors: function (commit_start, cb) {
      let commits_set = new Set();
      let commits = [commit_start];
      let commit;

      while (commit = commits.pop()) {
        commits_set.add(commit);
        if (commit.parent && commit.parent !== 'initial') {
          let parent1_commit = this.getCommit(commit.parent);
          // Bail early if cb's return is false
          if (cb(parent1_commit) === false) return commits_set;
          commits.push(parent1_commit);
        }

        if (commit.parent2 && commit.parent2 !== 'initial') {
          let parent2_commit = this.getCommit(commit.parent2);
          // Bail early if cb's return is false
          if (cb(parent2_commit) === false) return commits_set;
          commits.push(parent2_commit);
        }
      }

      return commits_set;
    },

    // @see https://stackoverflow.com/a/27285628
    mergeBase: function mergeBase(ref_a, ref_b) {
      let commit_a = typeof ref_a === 'string' ? this.getCommit(ref_a) : ref_a;
      let commit_b = typeof ref_b === 'string' ? this.getCommit(ref_b) : ref_b;

      let ff_parent;

      let a_to_root = this.walkAncestors(commit_a, (commit) => {
        if (commit === commit_b) {
          ff_parent = commit_b;
        }
        commit.color = "blue";
      });
      if (ff_parent) {
        // Clean up colors
        let all_commits = [...a_to_root];
        for (let commit of all_commits) {
          delete commit.color;
        }
        return ff_parent;
      }
  
      let b_to_root = this.walkAncestors(
        commit_b,
        (commit) => {
          if (commit === commit_a) {
            ff_parent = commit_a;
          }
          if (commit.color === "blue") {
            commit.color = "red";
          }
        }
      );

      if (ff_parent) {
        // Clean up colors
        let all_commits = [...new Set([...a_to_root, ...b_to_root])];
        for (let commit of all_commits) {
          delete commit.color;
        }
        return ff_parent;
      }

      this.walkAncestors(
        commit_b,
        (commit) => {
          if (commit.color === 'red' && commit.parent) {
            let parent = this.getCommit(commit.parent);

            parent.color = 'black';
          }
        }
      );

      let base_commit;
      this.walkAncestors(commit_a, function(commit) {
        if (commit.color === 'red') {
          base_commit = commit;
          return false;
        }
      });

      // Clean up colors
      let all_commits = [...new Set([...a_to_root, ...b_to_root])];
      for (let commit of all_commits) {
        delete commit.color;
      }

      return base_commit;
    },

    merge: logMiddleware(function(ref, noFF) {
      var mergeSource = this.getCommit(ref),
        mergeTarget = this.getCommit('HEAD');
      
      if (!mergeSource) {
        throw new Error('Cannot find ref: ' + ref);
      }

      if (mergeTarget.id === mergeSource.id) {
        throw new Error('Already up-to-date.');
      } else if (mergeTarget.parent2 === mergeSource.id) {
        throw new Error('Already up-to-date.');
      } else if (this.isAncestorOf(mergeSource, mergeTarget)) {
        throw new Error('Already up-to-date.');
      } else if (noFF === true) {
        let merge_base_commit = this.mergeBase(mergeSource, mergeTarget);
        let merge_base_child_commit;
        if (mergeSource.parent === merge_base_commit.id || mergeSource.parent2 === merge_base_commit.id) {
          merge_base_child_commit = mergeSource;
        } else {
          this.walkAncestors(mergeSource, function(c) {
            if (c.parent === merge_base_commit.id) {
              merge_base_child_commit = c;
              return false;
            }
          });
        }

        // Mark this as the start of "non-ff branch" to render it on different y-plane
        merge_base_child_commit.isNoFFBranch = true;

        this.commit({
          parent2: mergeSource.id,
          isNoFFCommit: true
        }, 'Merge');
      } else if (this.isAncestorOf(mergeTarget.id, mergeSource.id)) {
        this.fastForward(mergeSource);
        return 'Fast-Forward';
      } else {
        this.commit({
          parent2: mergeSource.id
        }, 'Merge');
      }
    }, 'merge'),

    rebase: logMiddleware(function(ref) {
      var targetCommit = this.getCommit(ref)
      if (!targetCommit) {
        throw new Error("Cannot find commit " + ref) // TODO: better message
      }

      this.branch('ORIG_HEAD')
      var origHeadCommit = this.getCommit('ORIG_HEAD')
      var origBranch = this.currentBranch
      var origRef = origBranch || origHeadCommit.id

      this.checkout(targetCommit.id)
      this.addReflogEntry(
        'HEAD', targetCommit.id, 'rebase: checkout ' + ref
      )

      var ancestorsFromTarget = this.getAncestorSet(ref)
      var ancestorsFromBase = this.getAncestorSet(origHeadCommit.id)
      var uniqueAncestors = getUniqueSetItems(ancestorsFromTarget, ancestorsFromBase)[1]
      var commitsToCopy = Object.keys(uniqueAncestors).concat(origHeadCommit.id)
            .sort(function(key1, key2) {
              return uniqueAncestors[key2] - uniqueAncestors[key1]
            })

      this.lock()
      setTimeout(function() {
        this.flashProperty(commitsToCopy, 'rebased', function() {
          commitsToCopy.forEach(function(ref) {
            var oldCommit = this.getCommit(ref)
            this.commit({rebased: true, rebaseSource: ref}, oldCommit.message)
              this.addReflogEntry(
                'HEAD', this.getCommit('HEAD').id, 'rebase: ' + (oldCommit.message || oldCommit.id)
              )
          }, this)
          var newHeadCommit = this.getCommit('HEAD')
          this.lock()
          setTimeout(function() {
            this.deleteBranch('ORIG_HEAD')
            if (origBranch) {
              this.moveTag(origBranch, newHeadCommit.id)
              this.reset(origBranch)
              this._setCurrentBranch(origBranch)
              this.addReflogEntry(
                'HEAD', this.getCommit('HEAD').id, 'rebase finished: returning to refs/heads/' + origBranch
              )
              this.addReflogEntry(
                origBranch, newHeadCommit.id, 'rebase finished: refs/heads/' +
                origBranch + ' onto ' + targetCommit.id
              )
            }
            this.unsetProperty(commitsToCopy, 'rebased')
            this.unlock()
          }.bind(this), 1000)
        }, this.unlock)
      }.bind(this), 1000)
    }, 'rebase'),
  };

  return HistoryView;
});
