import { NgModule } from '@angular/core';
import { addNavMenuItem, SharedModule } from '@vendure/admin-ui/core';
import { registerCustomDetailComponent } from '@vendure/admin-ui/core';

import { InvoiceDetailViewComponent } from './invoices-detail-view/invoices-detail-view.component';
import { getActionBarInvoiceButton } from './util';

@NgModule({
  imports: [SharedModule],
  providers: [
    addNavMenuItem(
      {
        id: 'invoices',
        label: 'Invoices',
        routerLink: ['/extensions/invoices'],
        icon: 'file-group',
        requiresPermission: 'AllowInvoicesPermission',
      },
      'settings'
    ),
    registerCustomDetailComponent({
      locationId: 'order-detail',
      component: InvoiceDetailViewComponent,
    }),
    getActionBarInvoiceButton(false),
    getActionBarInvoiceButton(true),
  ],
})
export class InvoicesNavModule {}
