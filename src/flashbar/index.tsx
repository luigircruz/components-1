// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from 'clsx';
import React, { useState } from 'react';
import { applyDisplayName } from '../internal/utils/apply-display-name';
import customCssProps from '../internal/generated/custom-css-properties';
import { Flash } from './flash';
import { FlashbarProps } from './interfaces';
import { getBaseProps } from '../internal/base-component';
import { TIMEOUT_FOR_ENTERING_ANIMATION } from './constant';
import Toggle from '../toggle/internal';
import { TransitionGroup } from 'react-transition-group';
import { Transition } from '../internal/components/transition';
import useBaseComponent from '../internal/hooks/use-base-component';
import { useContainerBreakpoints } from '../internal/hooks/container-queries';
import { useMergeRefs } from '../internal/hooks/use-merge-refs';
import { useReducedMotion, useVisualRefresh } from '../internal/hooks/use-visual-mode';
import VisualContext from '../internal/components/visual-context';
import styles from './styles.css.js';

export { FlashbarProps };

export default function Flashbar({ items, ...restProps }: FlashbarProps) {
  const { __internalRootRef } = useBaseComponent('Flashbar');
  const [breakpoint, ref] = useContainerBreakpoints(['xs']);
  const isRefresh = useVisualRefresh();
  const baseProps = getBaseProps(restProps);
  const mergedRef = useMergeRefs(ref, __internalRootRef);

  /**
   * All the flash items should have ids so we can identify which DOM element is being
   * removed from the DOM to animate it. Motion will be disabled if any of the provided
   * flash messages does not contain an `id`.
   */
  const motionDisabled = useReducedMotion(ref as any) || !isRefresh || (items && !items.every(item => 'id' in item));

  /**
   * The `enableStackingOption` property is a hidden boolean that allows for teams
   * to beta test the flashbar stacking feature. This property will add an additional
   * toggle control into the flashbar that will change the state of the `isFlashbarStacked`
   * boolean value by a given user.
   */
  const enableStackingOption = (restProps as any).enableStackingOption;
  const [isFlashbarStacked, setIsFlashbarStacked] = useState(false);

  /**
   * If the stacking feature is enabled and there is more than one item in the flashbar then
   * the toggle will be rendered to change the state from flat to stacked.
   */
  function renderStackingOption() {
    return (
      <>
        {enableStackingOption && items.length > 1 && (
          <div className={clsx(styles['stacking-option'])}>
            <Toggle onChange={({ detail }) => setIsFlashbarStacked(detail.checked)} checked={isFlashbarStacked}>
              Stack Notifications (<strong>{items.length}</strong>)
            </Toggle>
          </div>
        )}
      </>
    );
  }

  /**
   * If the `isFlashbarStacked` is true (which is only possible if `enableStackingOption` is true)
   * then the first item should be rendered followed by two dummy items that visually indicate
   * two, three, or more items exist in the stack.
   */
  function renderStackedItems() {
    const stackDepth = Math.min(3, items.length);
    const stackedItems = items.slice(0, stackDepth);

    return (
      <>
        {isFlashbarStacked && items.length > 0 && (
          <div className={styles.stack} style={{ [customCssProps.flashbarStackDepth]: stackDepth }}>
            {stackedItems.map((item, index) => (
              <div className={styles.item} style={{ [customCssProps.flashbarStackIndex]: index }} key={index}>
                {index === 0 && (
                  <Flash
                    key={item.id ?? index}
                    // eslint-disable-next-line react/forbid-component-props
                    className={clsx(isRefresh ? styles['flash-refresh'] : '')}
                    {...item}
                  />
                )}
                {index > 0 && <div className={clsx(styles.flash, styles[`flash-type-${item.type ?? 'info'}`])} />}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  /**
   * If the flashbar is flat and motion is `enabled` then the adding and removing of items
   * from the flashbar will render with visual transitions.
   */
  function renderFlatItemsWithTransitions() {
    return (
      <>
        {items && !isFlashbarStacked && !motionDisabled && (
          <TransitionGroup component={null}>
            {items &&
              items.map((item, index) => (
                <Transition
                  transitionChangeDelay={{ entering: TIMEOUT_FOR_ENTERING_ANIMATION }}
                  key={item.id ?? index}
                  in={true}
                >
                  {(state: string, transitionRootElement: React.Ref<HTMLDivElement> | undefined) => (
                    <Flash
                      ref={transitionRootElement}
                      key={item.id ?? index}
                      transitionState={state}
                      // eslint-disable-next-line react/forbid-component-props
                      className={clsx(isRefresh ? styles['flash-refresh'] : '')}
                      {...item}
                    />
                  )}
                </Transition>
              ))}
          </TransitionGroup>
        )}
      </>
    );
  }

  /**
   * If the flashbar is flat and motion is `disabled` then the adding and removing of items
   * from the flashbar will render without visual transitions.
   */
  function renderFlatItemsWithoutTransitions() {
    return (
      <>
        {items &&
          !isFlashbarStacked &&
          motionDisabled &&
          items.map((item, index) => (
            <Flash
              key={item.id ?? index}
              // eslint-disable-next-line react/forbid-component-props
              className={clsx(isRefresh ? styles['flash-refresh'] : '')}
              {...item}
            />
          ))}
      </>
    );
  }

  return (
    <div
      {...baseProps}
      className={clsx(baseProps.className, styles.flashbar, styles[`breakpoint-${breakpoint}`])}
      ref={mergedRef}
    >
      <VisualContext contextName="flashbar">
        {renderStackingOption()}
        {renderStackedItems()}
        {renderFlatItemsWithTransitions()}
        {renderFlatItemsWithoutTransitions()}
      </VisualContext>
    </div>
  );
}

applyDisplayName(Flashbar, 'Flashbar');
