/**
 * Copyright Schrodinger, LLC
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableRow
 * @typechecks
 */

'use strict';

import _ from 'lodash'
import FixedDataTableCell from 'FixedDataTableCell';
import FixedDataTableCellGroup from 'FixedDataTableCellGroup';
import FixedDataTableTranslateDOMPosition from 'FixedDataTableTranslateDOMPosition';
import PropTypes from 'prop-types';
import React from 'react';
import Scrollbar from 'Scrollbar';
import cx from 'cx';
import joinClasses from 'joinClasses';
import { sumPropWidths } from 'widthHelper';

// .fixedDataTableLayout/header border-bottom-width
var HEADER_BORDER_BOTTOM_WIDTH = 1;

/**
 * Component that renders the row for <FixedDataTable />.
 * This component should not be used directly by developer. Instead,
 * only <FixedDataTable /> should use the component internally.
 */
class FixedDataTableRowImpl extends React.Component {

  /**
   * The index of a row for which to fire the onMouseLeave event.
   */
  mouseLeaveIndex = null;

  static propTypes = {

    isScrolling: PropTypes.bool,

    /**
     * Array of data for the fixed columns.
     */
    fixedColumns: PropTypes.array.isRequired,

    /**
     * Array of <FixedDataTableColumn /> for the fixed columns positioned at end of the table.
     */
    fixedRightColumns: PropTypes.array.isRequired,

    /**
     * Height of the row.
     */
    height: PropTypes.number.isRequired,

    /**
     * Height of fixedDataTableCellGroupLayout/cellGroupWrapper.
     */
    cellGroupWrapperHeight: PropTypes.number,

    /**
     * Height of the content to be displayed below the row.
     */
    subRowHeight: PropTypes.number,

    /**
     * the row expanded.
     */
    rowExpanded: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.func,
    ]),

    /**
     * The row index.
     */
    index: PropTypes.number.isRequired,

    /**
     * Array of data for the scrollable columns.
     */
    scrollableColumns: PropTypes.array.isRequired,

    /**
     * The distance between the left edge of the table and the leftmost portion
     * of the row currently visible in the table.
     */
    scrollLeft: PropTypes.number.isRequired,

    /**
     * Pass true to not render the row. This is used internally for buffering rows.
     */
    fake: PropTypes.bool,

    /**
     * Width of the row.
     */
    width: PropTypes.number.isRequired,

    /**
     * Fire when a row is clicked.
     */
    onClick: PropTypes.func,

    /**
     * Fire when a contextual-menu is requested above a row.
     */
    onContextMenu: PropTypes.func,

    /**
     * Fire when a row is double clicked.
     */
    onDoubleClick: PropTypes.func,

    /**
     * Callback for when resizer knob (in FixedDataTableCell) is clicked
     * to initialize resizing. Please note this is only on the cells
     * in the header.
     * @param number combinedWidth
     * @param number leftOffset
     * @param number cellWidth
     * @param number|string columnKey
     * @param object event
     */
    onColumnResize: PropTypes.func,

    isColumnReordering: PropTypes.bool,
    /**
     * Callback for when reorder handle (in FixedDataTableCell) is clicked
     * to initialize reordering. Please note this is only on the cells
     * in the header.
     * @param number|string columnKey
     * @param number cellWidth
     * @param number leftOffset
     * @param object event
     */
    onColumnReorder: PropTypes.func,

    /**
     * Callback for when a cell is moved while reordering.
     * @param number distance
     */
    onColumnReorderMove: PropTypes.func,

    /**
     * Callback for when the mouse is released to complete reordering.
     * @param number distance
     */
    onColumnReorderEnd: PropTypes.func,

    touchEnabled: PropTypes.bool,

    /**
     * Whether the row is part of the header or footer.
     */
    isHeaderOrFooter: PropTypes.bool,

    /**
     * The value of the aria-rowindex attribute.
     */
    ariaRowIndex: PropTypes.number,

    /**
     * Whether the grid should be in RTL mode
     */
    isRTL: PropTypes.bool,

    /**
     * DOM attributes to be applied to the row.
     */
    attributes: PropTypes.object,
  };

  render() /*object*/ {
    if (this.props.fake) {
      return null;
    }

    var subRowHeight = this.props.subRowHeight || 0;
    var style = {
      width: this.props.width,
      height: this.props.height + subRowHeight,
    };
    var className = cx({
      'fixedDataTableRowLayout/main': true,
      'public/fixedDataTableRow/main': true,
      'public/fixedDataTableRow/highlighted': (this.props.index % 2 === 1),
      'public/fixedDataTableRow/odd': (this.props.index % 2 === 1),
      'public/fixedDataTableRow/even': (this.props.index % 2 === 0),
    });
    var fixedColumnsWidth = sumPropWidths(this.props.fixedColumns);
    const fixedColumns = this._renderCellGroup(this.props.fixedColumns, 0, 0, fixedColumnsWidth, 'fixedLeft');
    var columnsLeftShadow = this._renderColumnsLeftShadow(fixedColumnsWidth);
    var fixedRightColumnsWidth = sumPropWidths(this.props.fixedRightColumns);
    var scrollbarOffset = this.props.showScrollbarY ? this.props.scrollbarYWidth : 0;
    const fixedRightColumns = this._renderCellGroup(this.props.fixedRightColumns, this.props.width - fixedRightColumnsWidth - scrollbarOffset, 0, fixedRightColumnsWidth, 'fixedRight');
    var fixedRightColumnsShadow = fixedRightColumnsWidth ?
      this._renderFixedRightColumnsShadow(this.props.width - fixedRightColumnsWidth - scrollbarOffset - 5) : null;
    const scrollableColumns = this._renderCellGroup(this.props.scrollableColumns, fixedColumnsWidth, this.props.scrollLeft, this.props.width - fixedColumnsWidth - fixedRightColumnsWidth, 'scrollable');
    var scrollableColumnsWidth = sumPropWidths(this.props.scrollableColumns);
    var columnsRightShadow = this._renderColumnsRightShadow(fixedColumnsWidth + scrollableColumnsWidth);
    var rowExpanded = this._getRowExpanded(subRowHeight);
    var rowExpandedStyle = {
      height: subRowHeight,
      top: this.props.height,
      width: this.props.width,
    };

    let scrollbarSpacer = null;
    if (this.props.showScrollbarY) {
      var spacerStyles = {
        width: scrollbarOffset,
        height: this.props.height,
        // Since the box-sizing = border-box the border on the table is included in the width
        // so we need to account for the left and right border
        left: this.props.isRTL ? 2 : this.props.width - scrollbarOffset - 2,
      };
      scrollbarSpacer =
        <div 
          style={spacerStyles} 
          className={cx('public/fixedDataTable/scrollbarSpacer')}
        />;
    }

    return (
      <div
        className={joinClasses(className, this.props.className)}
        role={'row'}
        aria-rowindex={this.props.ariaRowIndex}
        {...this.props.attributes}
        onClick={this.props.onClick ? this._onClick : null}
        onContextMenu={this.props.onContextMenu ? this._onContextMenu : null}
        onDoubleClick={this.props.onDoubleClick ? this._onDoubleClick : null}
        onMouseDown={this.props.onMouseDown ? this._onMouseDown : null}
        onMouseUp={this.props.onMouseUp ? this._onMouseUp : null}
        onMouseEnter={this.props.onMouseEnter || this.props.onMouseLeave ? this._onMouseEnter : null}
        onMouseLeave={this.props.onMouseLeave ? this._onMouseLeave : null}
        onTouchStart={this.props.onTouchStart ? this._onTouchStart : null}
        onTouchEnd={this.props.onTouchEnd ? this._onTouchEnd : null}
        onTouchMove={this.props.onTouchMove ? this._onTouchMove : null}
        style={style}>
        <div className={cx('fixedDataTableRowLayout/body')}>
          {fixedColumns}
          {scrollableColumns}
          {columnsLeftShadow}
          {fixedRightColumns}
          {fixedRightColumnsShadow}
          {scrollbarSpacer}
        </div>
        {rowExpanded && <div
          className={cx('fixedDataTableRowLayout/rowExpanded')}
          style={rowExpandedStyle}>
          {rowExpanded}
        </div>}
        {columnsRightShadow}
      </div>
    );
  }


  _renderCellGroup(columns, baseLeft, offsetLeft, cellGroupWidth, cellGroupName) {
    if (_.isEmpty(columns)) {
      return null;
    }

    const cells = Array(columns.length);
    const isColumnReordering = this.props.isColumnReordering && columns.reduce(function (acc, column) {
        return acc || this.props.columnReorderingData.columnKey === column.props.columnKey;
      }, false);
    let left = 0;

    for (let j = 0; j < columns.length; j++) {
      cells[j] = this._renderCell(j, columns, isColumnReordering, left, offsetLeft, cellGroupWidth, cellGroupName);
      left += columns[j].props.width;
    }

    const style = { position: 'absolute', zIndex: cellGroupName === 'scrollable' ? 0 : 1 };
    FixedDataTableTranslateDOMPosition(style, baseLeft - offsetLeft, 0, false, this.props.isRTL);

    return (
      <div style={style}>
        {_.compact(cells)}
      </div>
    )
  }

  _renderCell(columnIndex, columns, isColumnReordering, left, offsetLeft, cellGroupWidth, cellGroupName) {
    const {
      height,
      isScrolling,
    } = this.props;
    const rowIndex = this.props.index;

    const columnProps = columns[columnIndex].props;
    const { width } = columnProps;
    const cellTemplate = columns[columnIndex].template;

    // horizontal bounds check
    const visible = (
      (left + width >= offsetLeft && left - offsetLeft < cellGroupWidth)
    );
    const recycle = columnProps.allowCellsRecycling;

    // if cell is recyclable then no need to render it into the DOM when it's not visible
    if (recycle && !isColumnReordering && !visible) {
      return null;
    }
    
    const cellIsResizable = columnProps.isResizable && this.props.onColumnResize;
    const onColumnResize = cellIsResizable ? this.props.onColumnResize : null;

    const cellIsReorderable = columnProps.isReorderable && this.props.onColumnReorder && rowIndex === -1 && cellGroupWidth !== columnProps.width;
    const onColumnReorder = cellIsReorderable ? this.props.onColumnReorder : null;

    const className = columnProps.cellClassName;
    const pureRendering = columnProps.pureRendering || false;

    return (
      <FixedDataTableCell
        key={`${columnIndex}-${cellGroupName}`}
        columnKey={columnProps.columnKey || columnIndex}
        rowIndex={rowIndex}
        cell={cellTemplate}
        cellGroupWidth={cellGroupWidth}
        isScrolling={isScrolling}
        align={columnProps.align}
        className={className}
        columnReorderingData={this.props.columnReorderingData}
        height={height}
        isColumnReordering={isColumnReordering}
        left={left}
        maxWidth={columnProps.maxWidth}
        minWidth={columnProps.minWidth}
        onColumnResize={onColumnResize}
        onColumnReorder={onColumnReorder}
        onColumnReorderMove={this.props.onColumnReorderMove}
        onColumnReorderEnd={this.props.onColumnReorderEnd}
        pureRendering={pureRendering}
        touchEnabled={this.props.touchEnabled}
        width={columnProps.width}
        visible={visible}
      />
    )
  }

  _getRowExpanded = (/*number*/ subRowHeight) => /*?object*/ {
    if (this.props.rowExpanded) {
      var rowExpandedProps = {
        rowIndex: this.props.index,
        height: subRowHeight,
        width: this.props.width,
      };

      var rowExpanded;
      if (React.isValidElement(this.props.rowExpanded)) {
        rowExpanded = React.cloneElement(this.props.rowExpanded, rowExpandedProps);
      } else if (typeof this.props.rowExpanded === 'function') {
        rowExpanded = this.props.rowExpanded(rowExpandedProps);
      }

      return rowExpanded;
    }
  };

  _renderColumnsLeftShadow = (/*number*/ left) => /*?object*/ {
    if (this.props.scrollLeft === 0) {
      return null;
    }

    var className = cx({
      'fixedDataTableRowLayout/fixedColumnsDivider': left > 0,
      'fixedDataTableRowLayout/columnsShadow': this.props.scrollLeft > 0,
      'public/fixedDataTableRow/fixedColumnsDivider': left > 0,
      'public/fixedDataTableRow/columnsShadow': this.props.scrollLeft > 0,
     });
     var dividerHeight = this.props.cellGroupWrapperHeight ?
       this.props.cellGroupWrapperHeight - HEADER_BORDER_BOTTOM_WIDTH : this.props.height;
     var style = {
       left: left,
       height: dividerHeight
     };
     if (this.props.isRTL) {
       style.right = left;
       style.left = 'auto';
     }
     return <div className={className} style={style} />;
  };

  _renderFixedRightColumnsShadow = (/*number*/ left) => /*?object*/ {
    var className = cx(
      'fixedDataTableRowLayout/columnsShadow',
      'fixedDataTableRowLayout/columnsRightShadow',
      'fixedDataTableRowLayout/fixedColumnsDivider',
      'public/fixedDataTableRow/columnsShadow',
      'public/fixedDataTableRow/columnsRightShadow',
      'public/fixedDataTableRow/fixedColumnsDivider'
    );
    var style = {
      height: this.props.height,
      left: left
    };
    if (this.props.isRTL) {
      style.right = left;
      style.left = 'auto';
    }
    return <div className={className} style={style} />;
  };

  _renderColumnsRightShadow = (/*number*/ totalWidth) => /*?object*/ {
    if (Math.ceil(this.props.scrollLeft + this.props.width) < Math.floor(totalWidth)) {
      var className = cx(
        'fixedDataTableRowLayout/columnsShadow',
        'fixedDataTableRowLayout/columnsRightShadow',
        'public/fixedDataTableRow/columnsShadow',
        'public/fixedDataTableRow/columnsRightShadow'
      );
      var style = {
        height: this.props.height
      };
      return <div className={className} style={style} />;
    }
  };

  _onClick = (/*object*/ event) => {
    this.props.onClick(event, this.props.index);
  };

  _onContextMenu = (/*object*/ event) => {
    this.props.onContextMenu(event, this.props.index)
  };

  _onDoubleClick = (/*object*/ event) => {
    this.props.onDoubleClick(event, this.props.index);
  };

  _onMouseUp = (/*object*/ event) => {
    this.props.onMouseUp(event, this.props.index);
  };

  _onMouseDown = (/*object*/ event) => {
    this.props.onMouseDown(event, this.props.index);
  };

  _onMouseEnter = (/*object*/ event) => {
    /**
     * This is necessary so that onMouseLeave is fired with the initial
     * row index since this row could be updated with a different index
     * when scrolling.
     */
    this.mouseLeaveIndex = this.props.index;
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter(event, this.props.index);
    }
  };

  _onMouseLeave = (/*object*/ event) => {
    if(this.mouseLeaveIndex === null) {
      this.mouseLeaveIndex = this.props.index;
    }
    this.props.onMouseLeave(event, this.mouseLeaveIndex);
    this.mouseLeaveIndex = null;
  };

  _onTouchStart = (/*object*/ event) => {
    this.props.onTouchStart(event, this.props.index);
  };

  _onTouchEnd = (/*object*/ event) => {
    this.props.onTouchEnd(event, this.props.index);
  };

  _onTouchMove = (/*object*/ event) => {
    this.props.onTouchMove(event, this.props.index);
  };
}

class FixedDataTableRow extends React.Component {
  static propTypes = {

    isScrolling: PropTypes.bool,

    /**
     * Height of the row.
     */
    height: PropTypes.number.isRequired,

    /**
     * Z-index on which the row will be displayed. Used e.g. for keeping
     * header and footer in front of other rows.
     */
    zIndex: PropTypes.number,

    /**
     * The vertical position where the row should render itself
     */
    offsetTop: PropTypes.number.isRequired,

    /**
     * Pass false to hide the row via CSS
     */
    visible: PropTypes.bool.isRequired,

    /**
     * Width of the row.
     */
    width: PropTypes.number.isRequired,
  };

  constructor(props) {
    super(props);
    this._initialRender = true;
  }

  componentDidMount() {
    this._initialRender = false;
  }

  render() /*object*/ {
    var style = {
      width: this.props.width,
      height: this.props.height,
      zIndex: (this.props.zIndex ? this.props.zIndex : 0),
      display: (this.props.visible ? 'block' : 'none'),
    };
    FixedDataTableTranslateDOMPosition(style, 0, this.props.offsetTop, this._initialRender, this.props.isRTL);

    const { offsetTop, zIndex, visible, ...rowProps } = this.props;

    return (
      <div
        style={style}
        className={cx('fixedDataTableRowLayout/rowWrapper')}
      >
        <FixedDataTableRowImpl {...rowProps} />
      </div>
    );
  }
}

export default FixedDataTableRow;
