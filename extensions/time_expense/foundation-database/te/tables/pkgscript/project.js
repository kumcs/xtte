/*
 * This file is part of the xtte package for xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2018 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

include("xtte");
xtte.project = new Object;

var _tab = mywindow.findChild("_tab"); 
var _tebilling = toolbox.loadUi("tebilling", mywindow);
_tab.insertTab(2, _tebilling, qsTr("Billing"));
_tab.setEnabled(2, privileges.check("CanMaintainRates CanViewRates"));

var _buttonBox = mywindow.findChild("_buttonBox");
var _gantt = _buttonBox.addButton(qsTr("Gantt..."), QDialogButtonBox.ActionRole);

var _owner = mywindow.findChild("_owner");
var _assignedTo = mywindow.findChild("_assignedTo");
var _started = mywindow.findChild("_started");
var _due = mywindow.findChild("_due");
var _assigned = mywindow.findChild("_assigned");
var _completed = mywindow.findChild("_completed");
var _prjtask = mywindow.findChild("_prjtask");
var _newTask = mywindow.findChild("_newTask");
var _editTask = mywindow.findChild("_editTask");
var _viewTask = mywindow.findChild("_viewTask");
var _number = mywindow.findChild("_number");
var _name = mywindow.findChild("_name");
var _billingGroup = mywindow.findChild("_billingGroup");
var _itemGroup = _tebilling.findChild("_itemGroup");
var _useItem = _tebilling.findChild("_useItem");
var _cust = _tebilling.findChild("_cust");
var _rate = _tebilling.findChild("_rate");
var _mode = 'new';
var _teprjid = -1; 
var _prjid = -1;

//set = function(input)
xtte.project.populated = function(input)
{
  if (_number.enabled)
    _mode = "edit";
  else
    _mode = "view";

  if (input.mode == "view" || !privileges.check("CanMaintainRates"))
  {
    _cust.enabled = false;
    _billingGroup.enabled = false;
  } 

  sql = "SELECT prj_id FROM prj WHERE prj_number=<? value('prj_number') ?>;";
  var params = new Object;
  params.prj_number = _number.text;
 
  var data = toolbox.executeQuery(sql, params);
  if (data.first())
  {
    _prjid = data.value("prj_id");
    xtte.project.populate();
  }
}

xtte.project.save = function(prjId)
{
  if (prjId <= 0)
    return;

  var params = new Object();
  params.teprj_id	= _teprjid;
  params.prj_id	= prjId;
  if (_cust.isValid())
    params.cust_id  	= _cust.id();
  if (_billingGroup.checked)
  {
    params.rate	= _rate.localValue;
    params.curr_id	= _rate.id();
  }

  var q = toolbox.executeDbQuery("project", "saveteprj", params);
  xtte.errorCheck(q);
}

xtte.project.populate = function()
{
  var params = new Object();
  params.prj_id = _prjid;    

  var q = toolbox.executeDbQuery("project", "selteprj", params);

  if (q.first())
  {
    _teprjid = q.value("teprj_id");
    _cust.setId(q.value("cust_id"));
    if (q.value("curr_id") == -1)
      _billingGroup.checked = false;
    else
    {
      _billingGroup.checked = true;
      _rate.setId(q.value("curr_id"));
      _rate.localValue = q.value("teprj_rate");
    }
    return;
  }
  else
    xtte.errorCheck(q);
}

xtte.project.newTask = function()
{
  if (_prjid == -1)
  {
    if (!mywindow.sSave(true))
      return;
    else
    {
      var params = new Object;
      params.prjNumber = _number.text;

      var q = toolbox.executeDbQuery("projectGantt", "getprj", params);
      if (q.first())
        _prjid = q.value("prj_id");
      else
        return;
    }
  }

  xtte.project.openTask("new");
}

xtte.project.editTask = function()
{
  if (_prjtask.altId() == 5)
    xtte.project.openTask("edit");
  else
   mywindow.sEditTask();
}

xtte.project.viewTask = function()
{
  if (_prjtask.altId() == 5)
    xtte.project.openTask("view");
  else
   mywindow.sViewTask();
}

xtte.project.openTask = function(mode)
{
  params = new Object;
  params.mode = mode;
  params.parent = "J";
  params.parent_id = _prjid;

  if (mode == "new")
  {
    params.parent_owner_username = _owner.username();
    params.parent_username = _assignedTo.username();
    params.parent_start_date = _started.date;
    params.parent_due_date = _due.date;
    params.parent_assigned_date = _assigned.date;
    params.parent_completed_date = _completed.date;
  }
  else
    params.task_id = _prjtask.id();
  if (_cust.isValid())
    params.cust_id = _cust.id();

  var win = toolbox.openWindow("task", mywindow, Qt.ApplicationModal);
  toolbox.lastWindow().set(params);
  var result = win.exec();
  if(result != 0)
    mywindow.populate();
}

xtte.project.gantt = function()
{
  if (!_due.isValid())
  {
    var msg = qsTr("You must enter a valid Due Date");
    QMessageBox.critical(mywindow, qsTr("Invalid Date"), msg);
    return;
  }

  var dparams = new Object;
  dparams.startDate = _started.date;
  dparams.dueDate = _due.date;

  var qry = toolbox.executeDbQuery("project","formatdates",dparams);
  if (qry.first())
  {
    var params = new Object;
    params.prjNumber = _number.text;
    params.prjName = _name.text;
    params.startDate = qry.value("start_date");
    params.dueDate = qry.value("due_date");

    toolbox.openWindow("projectGantt", mywindow, Qt.ApplicationModal);
    toolbox.lastWindow().set(params);
  }
}

// Initialize
_itemGroup.hide();
_useItem.hide();

// Connections
toolbox.coreDisconnect(_newTask, "clicked()", mywindow, "sNewTask()");
toolbox.coreDisconnect(_editTask, "clicked()", mywindow, "sEditTask()");
toolbox.coreDisconnect(_viewTask, "clicked()", mywindow, "sViewTask()");

mywindow.populated.connect(xtte.project.populated);
_newTask.clicked.connect(xtte.project.newTask);
_editTask.clicked.connect(xtte.project.editTask);
_viewTask.clicked.connect(xtte.project.viewTask);
_gantt.clicked.connect(xtte.project.gantt);
mydialog["finished(int)"].connect(xtte.project.save);

