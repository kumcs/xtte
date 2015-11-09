/*
 * This file is part of the xtte package for xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2012 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

debugger;

include("xtte");

// Define Variables
xtte.timeExpenseSheets = new Object;

var _all               = mywindow.findChild("_all");
var _close             = mywindow.findChild("_close");
var _query             = mywindow.findChild("_query");
var _new               = mywindow.findChild("_new");
var _print             = mywindow.findChild("_print");
var _sheets            = mywindow.findChild("_sheets");
var _selected          = mywindow.findChild("_selected");
var _approve           = mywindow.findChild("_approve");
var _process           = mywindow.findChild("_process");
var _weekending        = mywindow.findChild("_weekending");
var _showAllEmployees  = mywindow.findChild("_showAllEmployees");
var _showDirectReports = mywindow.findChild("_showDirectReports");
var _employee          = mywindow.findChild("_employee");
var _manager           = mywindow.findChild("_manager");
var _selected          = mywindow.findChild("_selected");
var _open              = mywindow.findChild("_open");
var _approved          = mywindow.findChild("_approved");
var _closed            = mywindow.findChild("_closed");
var _invoice           = mywindow.findChild("_invoice");
var _voucher           = mywindow.findChild("_voucher");
var _post              = mywindow.findChild("_post");

// Set up columns
_sheets.addColumn(qsTr("Sheet#"), XTreeWidget.orderColumn, Qt.AlignLeft,    true, "tehead_number");
_sheets.addColumn(qsTr("Date"),   XTreeWidget.dateColumn, Qt.AlignLeft,    true, "tehead_weekending");
_sheets.addColumn(qsTr("Employee"),   -1, Qt.AlignLeft,    true, "emp_code");
_sheets.addColumn(qsTr("Status"),     XTreeWidget.bigMoneyColumn, Qt.AlignCenter, true, "tehead_status");
if (privileges.check("CanViewRates")) {
  _sheets.addColumn(qsTr("To Invoice"),   XTreeWidget.bigMoneyColumn, Qt.AlignLeft,    true, "total_i");
  _sheets.addColumn(qsTr("To Voucher"),   XTreeWidget.bigMoneyColumn, Qt.AlignLeft,    true, "total_e");
}
_sheets.addColumn(qsTr("Invoiced"), XTreeWidget.dateColumn, Qt.AlignLeft, true, "invoiced");
_sheets.addColumn(qsTr("Vouchered"),XTreeWidget.dateColumn, Qt.AlignLeft, true, "vouchered");
_sheets.addColumn(qsTr("Posted"),   XTreeWidget.dateColumn, Qt.AlignLeft, true, "posted");

xtte.timeExpenseSheets.populateMenu = function(pMenu, pItem, pCol)
{
  var tmpact;

  if(pMenu == null)
    pMenu = _sheets.findChild("_menu");

  if(pMenu != null)
  {
    var currentItem  = _sheets.currentItem();
    var selected = _sheets.selectedItems();

    if (currentItem != null)
    {
      if (selected.length == 1) // Can only handle editing for a single select
      {
        var status = currentItem.rawValue("tehead_status");

        tmpact = pMenu.addAction(qsTr("Print"));
        tmpact.triggered.connect(xtte.timeExpenseSheets.printSheet);

        pMenu.addSeparator();

        tmpact = pMenu.addAction(qsTr("Edit..."));
        tmpact.triggered.connect(xtte.timeExpenseSheets.editSheet);
        tmpact.enabled = (status == 'O' && privileges.check("MaintainTimeExpense"));
 
        tmpact = pMenu.addAction(qsTr("View..."));
        tmpact.triggered.connect(xtte.timeExpenseSheets.viewSheet);
  
        tmpact = pMenu.addAction(qsTr("Delete"));
        tmpact.triggered.connect(xtte.timeExpenseSheets.deleteSheet);
        tmpact.enabled = (status == 'O' && privileges.check("MaintainTimeExpense"));
      }

      if (xtte.timeExpenseSheets.canApprove(selected))
      {
        pMenu.addSeparator();
        tmpact = pMenu.addAction(qsTr("Approve"));
        tmpact.enabled = privileges.check("CanApprove");
        tmpact.triggered.connect(xtte.timeExpenseSheets.approveSheets);
      }
      else if (xtte.timeExpenseSheets.canUnapprove(selected))
      {
        pMenu.addSeparator();
        tmpact = pMenu.addAction(qsTr("Unapprove"));
        tmpact.enabled = privileges.check("CanApprove");
        tmpact.triggered.connect(xtte.timeExpenseSheets.unapproveSheets);
      }

      if (status == 'A' || status == 'O')
      {
        tmpact = pMenu.addAction(qsTr("Close"));
        tmpact.enabled = privileges.check("MaintainTimeExpense");
        tmpact.triggered.connect(xtte.timeExpenseSheets.closeSheet);
      }

      if (status == 'C')
      {
        tmpact = pMenu.addAction(qsTr("Reopen"));
        tmpact.enabled = privileges.check("ReopenTimeExpense");
        tmpact.triggered.connect(xtte.timeExpenseSheets.reopenSheet);
      }

      if ((xtte.timeExpenseSheets.canProcess("invoiced", selected)) ||
          (xtte.timeExpenseSheets.canProcess("vouchered", selected)) ||
          (xtte.timeExpenseSheets.canProcess("posted", selected)))
        pMenu.addSeparator();

      if (xtte.timeExpenseSheets.canProcess("invoiced", selected))
      {
        tmpact = pMenu.addAction(qsTr("Invoice"));
        tmpact.triggered.connect(xtte.timeExpenseSheets.invoiceSheets);
        tmpact.enabled = privileges.check("allowInvoicing");
      }

      if (xtte.timeExpenseSheets.canProcess("vouchered", selected))
      {
        tmpact = pMenu.addAction(qsTr("Voucher"));
        tmpact.triggered.connect(xtte.timeExpenseSheets.voucherSheets);
        tmpact.enabled = privileges.check("allowVouchering");
      }

      if (xtte.timeExpenseSheets.canProcess("posted", selected))
      {
        tmpact = pMenu.addAction(qsTr("Post Time"));
        tmpact.triggered.connect(xtte.timeExpenseSheets.postSheets);
        tmpact.enabled = privileges.check("PostTimeSheets");
      }
    }
  }
}

xtte.timeExpenseSheets.canApprove = function(selected)
{
  for (var i = 0; i < selected.length; i++)
  {
     if (selected[i].rawValue("tehead_status") != 'O')
       return false;
  }
  return true;
}

xtte.timeExpenseSheets.canUnapprove = function(selected)
{
  for (var i = 0; i < selected.length; i++)
  {
     if ((selected[i].rawValue("tehead_status") != 'A') ||
         (selected[i].rawValue("posted") > 0) ||
         (selected[i].rawValue("vouchered") > 0) ||
         (selected[i].rawValue("invoiced") > 0))
       return false;
  }
  return true;
}

xtte.timeExpenseSheets.canProcess = function(process, selected)
{
  for (var i = 0; i < selected.length; i++)
  {
     if ((selected[i].rawValue("tehead_status") != 'A') ||
         (selected[i].rawValue(process) != 0))
       return false;
  }
  return true;
}

xtte.timeExpenseSheets.approve = function()
{
  toolbox.executeBegin();
  for (var i = 0; i < _sheets.topLevelItemCount; i++)
  {
    var item = _sheets.topLevelItem(i);
    if (item.rawValue("tehead_status") == "O")
    {
      var params   = new Object();
      params.tehead_id = item.id(); 
 
      q = toolbox.executeDbQuery("timeexpensesheets", "approve", params );
      if (!xtte.errorCheck(q))
      {
        toolbox.executeRollback();
        return;
      }
    } 
  }
  toolbox.executeCommit();
  xtte.timeExpenseSheets.fillList();
}

xtte.timeExpenseSheets.approveSheets = function()
{
  toolbox.executeBegin();
  var selected = _sheets.selectedItems();
  for (var i = 0; i < selected.length; i++)
  {
    var params   = new Object();
    params.tehead_id = selected[i].id();    

    q = toolbox.executeDbQuery("timeexpensesheets", "approve", params );        
    if (!xtte.errorCheck(q))
    {
      toolbox.executeRollback();
      return;
    }
  }
  toolbox.executeCommit();
  xtte.timeExpenseSheets.fillList(); 
}

xtte.timeExpenseSheets.unapproveSheets = function()
{
  toolbox.executeBegin();
  var selected = _sheets.selectedItems();
  for (var i = 0; i < selected.length; i++)
  {
    var params   = new Object();
    params.tehead_id = selected[i].id();    

    q = toolbox.executeDbQuery("timeexpensesheets", "unapprove", params );      
    if (!xtte.errorCheck(q))
    {
      toolbox.executeRollback();
      return;
    }
  }
  toolbox.executeCommit();
  xtte.timeExpenseSheets.fillList(); 
}


xtte.timeExpenseSheets.invoiceSheets = function()
{
  xtte.timeExpenseSheets.processSheets(_sheets.selectedItems(), true, false, false);
} 

xtte.timeExpenseSheets.voucherSheets = function()
{
  xtte.timeExpenseSheets.processSheets(_sheets.selectedItems(), false, true, false);
}

xtte.timeExpenseSheets.postSheets = function()
{    
  xtte.timeExpenseSheets.processSheets(_sheets.selectedItems(), false, false, true);
}

xtte.timeExpenseSheets.process = function()
{
  toolbox.executeBegin();

  // First loop through and invoice
  if (_invoice.checked)
  {
    var ids = [];
    for (var i = 0; i < _sheets.topLevelItemCount; i++)
    {
      var item = _sheets.topLevelItem(i);
      if ((item.rawValue("tehead_status") == 'A') &&
          (item.rawValue("invoiced") == 0)) 
        ids[i] = item.id();
    }

    if (ids.length)
    {
      var params   = new Object();
      params.tehead_ids = ids;    

      q = toolbox.executeDbQuery("timeexpensesheets", "invoice", params );      
      if (!xtte.errorCheck(q))
      {
        toolbox.executeRollback();
        return;
      }
    }
  }

  // Now loop through and do the others
  for (var i = 0; i < _sheets.topLevelItemCount; i++)
  {
    var item = _sheets.topLevelItem(i);
    var params   = new Object();
    params.tehead_id = item.id();  

    if ((_voucher.checked) && 
        (item.rawValue("tehead_status") == 'A') &&
        (item.rawValue("vouchered") == 0))
    {
      q = toolbox.executeDbQuery("timeexpensesheets", "voucher", params );      
      if (!xtte.errorCheck(q))
      {
        toolbox.executeRollback();
        return;
      }
    }

    if ((_post.checked) && 
        (item.rawValue("tehead_status") == 'A') &&
        (item.rawValue("posted") == 0))
    {
      if (metrics.value("PrjLaborAndOverhead") - 0 <= 0)
      {
        QMessageBox.critical(mywindow, qsTr("Setup Error"),
                         qsTr("No Labor and Overhead Account defined in CRM Setup."));
        {
          toolbox.executeRollback();
          return;
        }
      }

      params.phrase1 = qsTr("Post Time Sheet for ");
      params.phrase2 = qsTr(" to Project");

      q = toolbox.executeDbQuery("timeexpensesheets", "post", params );   
      if (!xtte.errorCheck(q))
      {
        toolbox.executeRollback();
        return;
      }
    } 
  }

  toolbox.executeCommit();

  if (_invoice.checked)
    mainwindow.invoicesUpdated(1, true);

  if (_voucher.checked)
    mainwindow.vouchersUpdated();

  if (_post.checked)
    mainwindow.glSeriesUpdated();

  xtte.timeExpenseSheets.fillList();
}

xtte.timeExpenseSheets.processSheets = function(selected, invoice, voucher, post)
{
  toolbox.executeBegin();
  if (invoice)
  { 
    // Prompt for invoice date
    var invcdate = mainwindow.dbDate();
    var params = new Object();
    params.label = "Invoice Date";
    var newdlg = toolbox.openWindow("XDateInputDialog", mywindow, Qt.ApplicationModal, Qt.Dialog);
    toolbox.lastWindow().set(params);
    var returnval = newdlg.exec();
    if (returnval == 1)
    {
      var invcdate = newdlg.getDate();
    }

    // Create an array so invoices can be consolidated
    var ids = [];
    for (var i = 0; i < selected.length; i++)
      ids[i] = selected[i].id();
      
    var params   = new Object();
    params.tehead_ids = ids;
    params.invchead_invcdate = invcdate;

    q = toolbox.executeDbQuery("timeexpensesheets", "invoice", params );        
    if (!xtte.errorCheck(q))
    {
      toolbox.executeRollback();
      return false;
    }
  }

  for (var i = 0; i < selected.length; i++)
  {
    var params   = new Object();
    params.tehead_id = selected[i].id();  

    if (voucher)
    {
      q = toolbox.executeDbQuery("timeexpensesheets", "voucher", params );      
      if (!xtte.errorCheck(q))
      {
        toolbox.executeRollback();
        return false;
      }
    }

    if (post)
    {
      if (metrics.value("PrjLaborAndOverhead") - 0 <= 0)
      {
        QMessageBox.critical(mywindow, qsTr("Setup Error"),
                         qsTr("No Labor and Overhead Account defined in CRM Setup."));
        {
          toolbox.executeRollback();
          return false;
        }
      }

      params.phrase1 = qsTr("Post Time Sheet for ");
      params.phrase2 = qsTr(" to Project");

      q = toolbox.executeDbQuery("timeexpensesheets", "post", params );   
      if (!xtte.errorCheck(q))
      {
        toolbox.executeRollback();   
        return false;
      }
    }
  }
   
  toolbox.executeCommit();

  if (invoice)
    mainwindow.invoicesUpdated(1, true);

  if (voucher)
    mainwindow.vouchersUpdated();

  if (post)
    mainwindow.glSeriesUpdated();

  xtte.timeExpenseSheets.fillList(); 
  
  return true;
}

xtte.timeExpenseSheets.deleteSheet = function()
{
  var msg = qsTr("This action can not be undone.  Are you sure you want to delete this Worksheet?");
  if (QMessageBox.question( mywindow, mywindow.windowTitle, msg, 
      QMessageBox.Yes | QMessageBox.Escape, QMessageBox.No | QMessageBox.Default) == QMessageBox.Yes)
  {
    var params   = new Object();
    params.tehead_id = _sheets.id();    

    toolbox.executeDbQuery("timeexpensesheet", "deltehead", params );

    xtte.timeExpenseSheets.fillList();
  }
}

xtte.timeExpenseSheets.closeSheet = function()
{
  var msg = qsTr("Are you sure you want to close this Worksheet?");
  if (QMessageBox.question( mywindow, mywindow.windowTitle, msg, 
      QMessageBox.Yes | QMessageBox.Escape, QMessageBox.No | QMessageBox.Default) == QMessageBox.Yes)
  {
    var params   = new Object();
    params.tehead_id = _sheets.id();    

    q = toolbox.executeDbQuery("timeexpensesheets", "close", params );  
    if (xtte.errorCheck(q))
      xtte.timeExpenseSheets.fillList(); 
  }
}

xtte.timeExpenseSheets.reopenSheet = function()
{
  var msg = qsTr("Are you sure you want to reopen this Worksheet?");
  if (QMessageBox.question( mywindow, mywindow.windowTitle, msg, 
      QMessageBox.Yes | QMessageBox.Escape, QMessageBox.No | QMessageBox.Default) == QMessageBox.Yes)
  {
    var params   = new Object();
    params.tehead_id = _sheets.id();    

    q = toolbox.executeDbQuery("timeexpensesheets", "reopen", params );  
    if (xtte.errorCheck(q))
      xtte.timeExpenseSheets.fillList(); 
  }
}

xtte.timeExpenseSheets.editSheet = function()
{
  if (_sheets.currentItem().rawValue("tehead_status") == 'O')
    xtte.timeExpenseSheets.openSheet(xtte.editMode);
  else
    xtte.timeExpenseSheets.openSheet(xtte.viewMode);
}

xtte.timeExpenseSheets.newSheet = function()
{
  xtte.timeExpenseSheets.openSheet(xtte.newMode);
}

xtte.timeExpenseSheets.viewSheet = function()
{
  xtte.timeExpenseSheets.openSheet(xtte.viewMode);
}

xtte.timeExpenseSheets.openSheet = function(mode)
{
  var params   = new Object();
  params.mode   = mode;
  if (mode) // Not new
    params.tehead_id = _sheets.id();
  else // New
  {
    if (_selected)
      params.emp_id = _employee.id();
  }

  var te = toolbox.openWindow("timeExpenseSheet", mywindow, Qt.ApplicationModal);
  toolbox.lastWindow().set(params);
  te.exec();
  xtte.timeExpenseSheets.fillList();
}

xtte.timeExpenseSheets.getParams = function()
{
  params = new Object();

  if (!_open.checked &&
      !_approved.checked &&
      !_closed.checked)
  {
    params.statusList = "";
    return params;
  }

  params.startDate = _weekending.startDate;
  params.endDate   = _weekending.endDate;
  if (_selected.checked)
    params.emp_id  = _employee.id();
  if (_showDirectReports.checked)
    params.mgr_emp_id  = _manager.id();

  var statusList = [];
  var num = 0;
  
  if (_open.checked)
  {
    statusList[num] = "'O'";
    num = num + 1;
  }
  if (_approved.checked)
  {
    statusList[num] = "'A'";
    num = num + 1;
  }
  if (_closed.checked)
    statusList[num] = "'C'";
  
  params.statusList  = statusList.toString();
  params.approved  = qsTr("Approved");
  params.closed    = qsTr("Closed");
  params.open      = qsTr("Open");
  params.yes       = qsTr("Yes");
  params.no        = qsTr("No");
  params.na        = qsTr("N/A");

  return params;
}


xtte.timeExpenseSheets.fillList = function()
{ 
  var params = xtte.timeExpenseSheets.getParams();
  if (!params.statusList.length)
    return;

  q = toolbox.executeDbQuery("timeexpensesheets","detail", params);

  _sheets.populate(q);
  if (!xtte.errorCheck(q))
    return;
}

xtte.timeExpenseSheets.printSheet = function()
{
  params = xtte.timeExpenseSheets.getParams();
  params.tehead_id = _sheets.id();
  toolbox.printReport("TimeExpenseSheet",params);
}

xtte.timeExpenseSheets.printReport = function()
{
  var params = xtte.timeExpenseSheets.getParams();
  params.includeFormatted = true;

  toolbox.printReport("TimeExpenseSheets",params);
}

xtte.timeExpenseSheets.populateEmployees = function()
{
  // getEffectiveXtUser and crmacct_emp_id were created in the same release
  var q = toolbox.executeQuery("SELECT crmacct_emp_id AS emp_id"
                             + "  FROM crmacct "
                             + " WHERE crmacct_usr_username = getEffectiveXtUser();");
  // if they don't exist, try the older relationship maintained in the emp table
  if (q.lastError().type != QSqlError.NoError)
      q = toolbox.executeQuery("SELECT emp_id "
                             + "  FROM emp "
                             + " WHERE emp_username = CURRENT_USER;");

  if (q.first())
  {
    _employee.setId(q.value("emp_id"));
    _manager.setId(q.value("emp_id"));
  }

  // determine if the current user is active
  currSql = "SELECT emp_active "
          + "FROM  emp "
          + "WHERE emp_id = <? value('emp_id') ?>";

  var params   = new Object();
  params.emp_id = _employee.id(); 

  var empActive;
 
  q = toolbox.executeQuery(currSql,params);
  if (q.first()) 
    empActive = q.value("emp_active");

  if (privileges.check("MaintainTimeExpenseOthers"))
  {
    _showAllEmployees.visible = true;
    _showDirectReports.visible = true;
    _manager.visible = true;
  }
  else
  {
    _showAllEmployees.visible = false;
    _showDirectReports.visible = false;
    _manager.visible = false;
    _employee.enabled = false;
    if (privileges.check("MaintainTimeExpenseSelf"))
    {
      if (!empActive){
        QMessageBox.critical(mywindow, mywindow.windowTitle, 
                    qsTr("It appears that your current user isn't an active employee.") );                                            
        if (mywindow.windowModality)
          mydialog.reject();
        else
          mywindow.close();
      }
    }      
    else
    {
      QMessageBox.critical(mywindow, qsTr("Permissions Error"),
                    qsTr("You do not have permissions to maintain Worksheet entries"));
      if (mywindow.windowModality)
        mydialog.reject();
      else
        mywindow.close();
    }
  }
}

// Initialize
_weekending.setStartNull(qsTr("Earliest"), startOfTime, true);
_weekending.setEndNull(qsTr("Latest"),     endOfTime,   true);

_approve.enabled = privileges.check("CanApprove");
_selected.checked = true;
_showAllEmployees.visible = false;
_showDirectReports.visible = false;
_manager.visible = false;
//_manager.enabled = false;

if (!privileges.check("allowInvoicing"))
{
  _invoice.forgetful = true;
  _invoice.checked = false;
  _invoice.enabled = false;
}

if (!privileges.check("allowVouchering"))
{
  _voucher.forgetful = true;
  _voucher.checked = false;
  _voucher.enabled = false;
}

if (!privileges.check("PostTimeSheets"))
{
  _post.forgetful = true;
  _post.checked = false;
  _post.enabled = false;
}

// Make connections
_new.triggered.connect(xtte.timeExpenseSheets.newSheet);
_close.triggered.connect(mywindow, "close");
_approve.triggered.connect(xtte.timeExpenseSheets.approve);
_process.triggered.connect(xtte.timeExpenseSheets.process);
_print.triggered.connect(xtte.timeExpenseSheets.printReport);
_query.triggered.connect(xtte.timeExpenseSheets.fillList);

_selected["toggled(bool)"].connect(_employee["setEnabled(bool)"]);
_employee["newId(int)"].connect(xtte.timeExpenseSheets.fillList);

_showDirectReports["toggled(bool)"].connect(_manager["setEnabled(bool)"]);
_manager["newId(int)"].connect(xtte.timeExpenseSheets.fillList);

mainwindow.invoicesUpdated.connect(xtte.timeExpenseSheets.fillList);
mainwindow.vouchersUpdated.connect(xtte.timeExpenseSheets.fillList);

_sheets["populateMenu(QMenu *, XTreeWidgetItem *, int)"].connect(xtte.timeExpenseSheets.populateMenu);
if (privileges.check("MaintainTimeExpense"))
  _sheets.itemSelected.connect(xtte.timeExpenseSheets.editSheet);
else
{
  _new.enabled = false;
  _sheets.itemSelected.connect(xtte.timeExpenseSheets.viewSheet);
}

xtte.timeExpenseSheets.populateEmployees();
