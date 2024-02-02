import React from 'react';
import { createComponent } from '@lit/react';
import { SygmaProtocolWidget } from '@buildwithsygma/sygmaprotocol-widget';

export const SygmaProtocolReactWidget = createComponent({
  tagName: 'sygmaprotocol-widget',
  elementClass: SygmaProtocolWidget,
  react: React
});
