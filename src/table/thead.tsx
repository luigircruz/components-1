// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from 'clsx';
import React from 'react';
import { TableProps } from './interfaces';
import SelectionControl, { SelectionControlProps } from './selection-control';
import { focusMarkers } from './use-selection';
import { fireNonCancelableEvent, NonCancelableEventHandler } from '../internal/events';
import { getColumnKey } from './utils';
import { TableHeaderCell } from './header-cell';
import { Resizer } from './resizer';
import { useColumnWidths } from './use-column-widths';
import styles from './styles.css.js';
import headerCellStyles from './header-cell/styles.css.js';

export interface TheadProps {
  containerWidth: number | null;
  selectionType: TableProps.SelectionType | undefined;
  columnDefinitions: ReadonlyArray<TableProps.ColumnDefinition<any>>;
  sortingColumn: TableProps.SortingColumn<any> | undefined;
  sortingDescending: boolean | undefined;
  sortingDisabled: boolean | undefined;
  variant: TableProps.Variant;
  wrapLines: boolean | undefined;
  resizableColumns: boolean | undefined;
  selectAllProps: SelectionControlProps;
  onFocusMove: ((sourceElement: HTMLElement, fromIndex: number, direction: -1 | 1) => void) | undefined;
  onCellFocus?: (colIndex: number) => void;
  onCellBlur?: () => void;
  onResizeFinish: (newWidths: Record<string, number>) => void;
  showFocusRing?: number | null;
  onSortingChange: NonCancelableEventHandler<TableProps.SortingState<any>> | undefined;
  sticky?: boolean;
  hidden?: boolean;
  stuck?: boolean;
}

const Thead = React.forwardRef(
  (
    {
      containerWidth,
      selectionType,
      selectAllProps,
      columnDefinitions,
      sortingColumn,
      sortingDisabled,
      sortingDescending,
      resizableColumns,
      variant,
      wrapLines,
      onFocusMove,
      onCellFocus,
      onCellBlur,
      onSortingChange,
      onResizeFinish,
      showFocusRing = null,
      sticky = false,
      hidden = false,
      stuck = false,
    }: TheadProps,
    outerRef: React.Ref<HTMLTableRowElement>
  ) => {
    const headerCellClass = clsx(
      headerCellStyles['header-cell'],
      headerCellStyles[`header-cell-variant-${variant}`],
      sticky && headerCellStyles['header-cell-sticky'],
      stuck && headerCellStyles['header-cell-stuck']
    );
    const selectionCellClass = clsx(styles['selection-control'], styles['selection-control-header']);
    const { columnWidths, totalWidth, updateColumn } = useColumnWidths();
    const [tableCellRefs, setTableCellRefs] = React.useState<any[]>([]);
    const [cellWidths, setCellWidths] = React.useState<any[]>([]);

    const arrLength = columnDefinitions.length;

    React.useEffect(() => {
      // add or remove refs
      setTableCellRefs(tableCellRefs =>
        [...new Array(arrLength)].map((_: any, i: any) => tableCellRefs[i] || React.createRef())
      );
    }, [arrLength, columnDefinitions]);

    React.useEffect(() => {
      const getCellWidths = () => {
        let widthsArray = tableCellRefs.map(ref => ref.current?.previousSibling?.offsetWidth);
        widthsArray = widthsArray.filter(x => x);
        widthsArray = widthsArray.map((elem, index) => widthsArray.slice(0, index + 1).reduce((a, b) => a + b));
        setCellWidths([0, ...widthsArray]);
      };

      getCellWidths();
    }, [tableCellRefs]);

    return (
      <thead className={clsx(!hidden && styles['thead-active'])}>
        <tr {...focusMarkers.all} ref={outerRef}>
          {selectionType === 'multi' && (
            <th className={clsx(headerCellClass, selectionCellClass)} scope="col">
              <SelectionControl
                onFocusDown={event => onFocusMove!(event.target as HTMLElement, -1, +1)}
                {...selectAllProps}
                {...(hidden ? { tabIndex: -1 } : {})}
              />
            </th>
          )}
          {selectionType === 'single' && (
            <th className={clsx(headerCellClass, selectionCellClass)} scope="col">
              <span aria-hidden={true}>
                {/*non-empty element to prevent table cell from collapsing in IE */}
                &nbsp;
              </span>
            </th>
          )}
          {columnDefinitions.map((column, colIndex) => {
            let widthOverride;
            if (resizableColumns) {
              if (columnWidths) {
                // use stateful value if available
                widthOverride = columnWidths[getColumnKey(column, colIndex)];
              }
              if (colIndex === columnDefinitions.length - 1 && containerWidth && containerWidth > totalWidth) {
                // let the last column grow and fill the container width
                widthOverride = 'auto';
              }
            }
            return (
              <TableHeaderCell
                key={getColumnKey(column, colIndex)}
                ref={tableCellRefs[colIndex]}
                className={clsx(headerCellClass, column.isSticky && headerCellStyles['header-cell-freeze'])}
                style={{
                  width: widthOverride || column.width,
                  minWidth: sticky ? undefined : column.minWidth,
                  maxWidth: resizableColumns || sticky ? undefined : column.maxWidth,
                  left: column.isSticky ? `${cellWidths[colIndex]}px` : 'auto',
                }}
                tabIndex={sticky ? -1 : 0}
                showFocusRing={colIndex === showFocusRing}
                column={column}
                activeSortingColumn={sortingColumn}
                sortingDescending={sortingDescending}
                sortingDisabled={sortingDisabled}
                wrapLines={wrapLines}
                resizer={
                  resizableColumns && (
                    <Resizer
                      onDragMove={newWidth => updateColumn(colIndex, newWidth)}
                      onFinish={() => onResizeFinish(columnWidths)}
                    />
                  )
                }
                onClick={detail => fireNonCancelableEvent(onSortingChange, detail)}
                onFocus={() => onCellFocus?.(colIndex)}
                onBlur={onCellBlur}
              />
            );
          })}
        </tr>
      </thead>
    );
  }
);

export default Thead;
