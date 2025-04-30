import { Component } from '@angular/core';
import {
  OrderDetailFragment,
  OrderHistoryEntryComponent,
  TimelineDisplayType,
  TimelineHistoryEntry,
  SharedModule,
} from '@vendure/admin-ui/core';

@Component({
  standalone: true,
  imports: [SharedModule],
  selector: 'stripe-subscription-notification-component',
  template: `
    <span>{{ entry.data.message }}</span>
    <a
      *ngIf="entry.data.subscriptionId"
      [href]="
        'https://dashboard.stripe.com/subscriptions/' +
        entry.data.subscriptionId
      "
      class="btn btn-link btn-sm details-button"
      target="_blank"
    >
      <clr-icon shape="export" size="12"></clr-icon>
    </a>
    <br />
    <vdr-history-entry-detail *ngIf="entry.data.error">
      <vdr-object-tree [value]="entry.data.error"></vdr-object-tree>
    </vdr-history-entry-detail>
    <vdr-history-entry-detail
      *ngIf="entry.data.subscription"
      title="Subscription"
    >
      <vdr-object-tree [value]="entry.data.subscription"></vdr-object-tree>
    </vdr-history-entry-detail>
  `,
})
export class HistoryEntryComponent implements OrderHistoryEntryComponent {
  entry!: TimelineHistoryEntry;
  order!: OrderDetailFragment;

  constructor() {}

  getDisplayType(entry: TimelineHistoryEntry): TimelineDisplayType {
    return entry.data.valid ? 'success' : 'error';
  }

  isFeatured(entry: TimelineHistoryEntry): boolean {
    return !entry.data.valid;
  }

  getName(entry: TimelineHistoryEntry): string {
    return 'Stripe Subscriptions';
  }

  getIconShape(entry: TimelineHistoryEntry) {
    // No icons for not-featured entries
    return this.isFeatured(entry) ? 'exclamation-circle' : undefined;
  }
}
