// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useCallback, useEffect, useRef, useState, useImperativeHandle } from 'react';
import clsx from 'clsx';

import { KeyCode } from '../internal/keycode';
import { getBaseProps } from '../internal/base-component';
import useFocusVisible from '../internal/hooks/focus-visible';

import Arrow from './arrow';
import Portal from '../internal/components/portal';
import { PopoverProps } from './interfaces';
import PopoverContainer from './container';
import PopoverBody from './body';

import styles from './styles.css.js';
import { NonCancelableEventHandler, fireNonCancelableEvent } from '../internal/events/index';
import { InternalBaseComponentProps } from '../internal/hooks/use-base-component';
import { useMergeRefs } from '../internal/hooks/use-merge-refs';
import { usePortalModeClasses } from '../internal/hooks/use-portal-mode-classes';

export interface InternalPopoverProps extends PopoverProps, InternalBaseComponentProps {
  __onOpen?: NonCancelableEventHandler<null>;
}

export interface InternalPopoverRef {
  dismissPopover: () => void;
}

export default React.forwardRef(InternalPopover);

function InternalPopover(
  {
    position = 'right',
    size = 'medium',
    fixedWidth = false,
    triggerType = 'text',
    dismissButton = true,
    dismissAriaLabel,

    children,
    header,
    content,

    renderWithPortal = false,

    __onOpen,
    __internalRootRef = null,
    ...restProps
  }: InternalPopoverProps,
  ref: React.Ref<InternalPopoverRef>
) {
  const baseProps = getBaseProps(restProps);
  const focusVisible = useFocusVisible();
  const triggerRef = useRef<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const clickFrameId = useRef<number | null>(null);

  const [visible, setVisible] = useState(false);
  const [wasVisible, setWasVisible] = useState(false);
  const [dismissedViaDocumentClick, setDismissedViaDocumentClick] = useState(false);

  const onTriggerClick = useCallback(() => {
    fireNonCancelableEvent(__onOpen);
    setVisible(true);
  }, [__onOpen]);

  const onDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const onTriggerKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.keyCode === KeyCode.tab || event.keyCode === KeyCode.escape) {
      setVisible(false);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    dismissPopover: onDismiss,
  }));

  useEffect(() => {
    if (!triggerRef.current) {
      return;
    }
    const document = triggerRef.current.ownerDocument;

    const onDocumentClick = () => {
      // Dismiss popover unless there was a click inside within the last animation frame.
      if (clickFrameId.current === null) {
        setVisible(false);
        setDismissedViaDocumentClick(true);
      }
    };

    // useCapture=false makes sure this listener is called after the one attached to the element.
    // the options.capture notation is unsupported by IE.
    document.addEventListener('mousedown', onDocumentClick, false);

    return () => {
      document.removeEventListener('mousedown', onDocumentClick, false);
    };
  }, []);

  useEffect(() => {
    if (
      visible === false &&
      wasVisible === true &&
      document.activeElement === document.body &&
      !dismissedViaDocumentClick
    ) {
      triggerRef.current?.focus();
    }
    setWasVisible(visible);
    setDismissedViaDocumentClick(false);
  }, [visible, wasVisible, dismissedViaDocumentClick]);

  const popoverClasses = usePortalModeClasses(triggerRef);

  const triggerProps = {
    // https://github.com/microsoft/TypeScript/issues/36659
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ref: triggerRef as any,
    onClick: onTriggerClick,
    onKeyDown: onTriggerKeyDown,
    className: clsx(styles.trigger, styles[`trigger-type-${triggerType}`]),
  };

  const popoverContent = (
    <div
      aria-live={dismissButton ? undefined : 'polite'}
      aria-atomic={dismissButton ? undefined : true}
      className={clsx(popoverClasses, styles['popover-content'])}
    >
      {visible && (
        <PopoverContainer
          size={size}
          fixedWidth={fixedWidth}
          position={position}
          trackRef={triggerRef}
          arrow={position => <Arrow position={position} />}
          renderWithPortal={renderWithPortal}
          zIndex={renderWithPortal ? 7000 : undefined}
        >
          <PopoverBody
            dismissButton={dismissButton}
            dismissAriaLabel={dismissAriaLabel}
            header={header}
            onDismiss={onDismiss}
            overflowVisible="both"
          >
            {content}
          </PopoverBody>
        </PopoverContainer>
      )}
    </div>
  );

  const mergedRef = useMergeRefs(popoverRef, __internalRootRef);

  return (
    <div
      {...baseProps}
      className={clsx(styles.root, baseProps.className)}
      ref={mergedRef}
      onMouseDown={() => {
        // Indicate there was a click inside popover recently, including nested portals.
        clickFrameId.current = requestAnimationFrame(() => {
          clickFrameId.current = null;
        });
      }}
    >
      {triggerType === 'text' ? (
        <button {...triggerProps} type="button" aria-haspopup="dialog" {...focusVisible}>
          <span className={styles['trigger-inner-text']}>{children}</span>
        </button>
      ) : (
        <span {...triggerProps}>{children}</span>
      )}
      {renderWithPortal ? <Portal>{popoverContent}</Portal> : popoverContent}
    </div>
  );
}
