// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { useState } from 'react';
import AppLayout from '~components/app-layout';
import Flashbar from '~components/flashbar';
import Header from '~components/header';
import Link from '~components/link';
import ScreenshotArea from '../utils/screenshot-area';
import { Breadcrumbs, Navigation, Tools, Footer } from './utils/content-blocks';
import * as toolsContent from './utils/tools-content';
import labels from './utils/labels';
import Table from '~components/table';
import { generateItems, Instance } from '../table/generate-data';
import { columnsConfig } from '../table/shared-configs';
import Button from '~components/button';

const items = generateItems(20);

export default function () {
  const [notifications, setNotifications] = useState([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<keyof typeof toolsContent>('long');

  function openHelp(article: keyof typeof toolsContent) {
    setToolsOpen(true);
    setSelectedTool(article);
  }

  function addNotification() {
    const newNotifications = [...notifications];

    newNotifications.push({
      type: 'success',
      id: Math.floor(Math.random() * 999999),
      header: (
        <div>
          This is a very very very long flash message that will cause the notifications to wrap over multiple lines. I
          hope it wont overlap with the breadcrumbs, that would be awkward. This is a very very very long flash message
          that will cause the notifications to wrap over multiple lines. I hope it wont overlap with the breadcrumbs,
          that would be awkward.
        </div>
      ),
      statusIconAriaLabel: 'success',
    });

    setNotifications(newNotifications);
  }

  function removeNotification() {
    const newNotifications = [...notifications];

    newNotifications.pop();
    setNotifications(newNotifications);
  }

  return (
    <ScreenshotArea gutters={false}>
      <AppLayout
        ariaLabels={labels}
        breadcrumbs={<Breadcrumbs />}
        navigation={<Navigation />}
        contentType="table"
        stickyNotifications={true}
        tools={<Tools>{toolsContent[selectedTool]}</Tools>}
        toolsOpen={toolsOpen}
        onToolsChange={({ detail }) => setToolsOpen(detail.open)}
        notifications={<Flashbar items={notifications} />}
        content={
          <Table<Instance>
            header={
              <Header
                variant="awsui-h1-sticky"
                description="Demo page with footer"
                info={
                  <Link variant="info" onFollow={() => openHelp('long')}>
                    Long help text
                  </Link>
                }
                actions={
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="primary" onClick={() => addNotification()}>
                      Add Item
                    </Button>

                    <Button variant="primary" onClick={() => removeNotification()}>
                      Remove Item
                    </Button>
                  </div>
                }
              >
                Sticky Scrollbar Example
              </Header>
            }
            stickyHeader={true}
            variant="full-page"
            columnDefinitions={columnsConfig}
            items={items}
          />
        }
      />
      <Footer legacyConsoleNav={false} />
    </ScreenshotArea>
  );
}
