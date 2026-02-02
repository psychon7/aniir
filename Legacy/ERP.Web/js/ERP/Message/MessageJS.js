$(document).ready(initMsg);


function initMsg() {
    getMessage();
}


function getMessage() {
    $('#div_done_list').empty();
    $('#div_todo_list').empty();
    var type = getParameterByName('mt');
    type = isNaN(type) ? 2 : (type * 1);
    type = type > 0 ? type : 2;
    var url = window.webservicePath + "/GetMessage";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: '{type:' + type + '}',
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                if (type === 2) {
                    SetToDoList(data2Treat);
                }
            } else {
                AuthencationError();
            }
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
}

function SetToDoList(oneMessage) {
    if (!jQuery.isEmptyObject(oneMessage)) {
        var msgItems = oneMessage.AllMessages;
        if (msgItems && msgItems.length > 0) {
            var msgDone = searchInArray(msgItems, 'IsTreated', true);
            var msgToDo = searchInArray(msgItems, 'IsTreated', false);
            $.each(msgDone, function(name, item) {
                addOneTodoDone(item);
            });
            $.each(msgToDo, function (name, item) {
                addOneTodo(item);
            });
        }
    }
}

function addOneTodoDone(oneMsg) {
    var isObj = !jQuery.isEmptyObject(oneMsg);
    if (isObj) {
        var msgContent = oneMsg.Content;
        var msgId = oneMsg.MsgId;
        var updateTime = getDateString(oneMsg.DUpdate);
            msgId = msgId * 1;
        var msgItemId = oneMsg.Id;
        var btnDelete = "<button class='btn btn-inverse' onclick='return DeleteTodoClick(this)'  msgId='" + msgId + "' msgGuid='" + msgItemId + "' ><i class='fa fa-times'></i></button>";
        var oneContent = "<div class='form-group'>" +
            "<div class='col-sm-1'>" +
            "<input type='checkbox' checked='checked' class='form-control' msgId='" + msgId + "' onclick='ToDoIsDone(this)' id='ip_todo_content_" + msgItemId + "' msgGuid='" + msgItemId + "'/>" +
            "</div>" +
            "<label class='col-sm-2 control-label'>" + updateTime + "</label>" +
            "<div class='col-sm-8'>" +
            "<input type='text' class='form-control' value='" + msgContent + "' msgGuid='" + msgItemId + "' disabled />" +
            "</div>" +
            "<div class='col-sm-1 center'>" + btnDelete +
            "</div>" +
            "</div>";
        $('#div_done_list').append(oneContent);
    }
}

function addOneTodo(oneMsg) {
    var isObj = !jQuery.isEmptyObject(oneMsg);
    var msgContent = isObj ? oneMsg.Content : '';
    var msgId = isObj ? oneMsg.MsgId : 0;
    msgId = msgId * 1;
    var msgItemId = isObj ? oneMsg.Id : NewGuid();
    var btnclass = isObj ? 'fa fa-refresh' : 'fa fa-save';
    var disabled = isObj ? '' : 'disabled';
    var btnSaveUpdate = "<button class='btn btn-inverse' onclick='return CreateUpdateTodo(this)' msgId='" + msgId + "' msgGuid='" + msgItemId + "' ><i class='" + btnclass + "'></i></button>";
    var btnDelete = "<button class='btn btn-inverse' onclick='return DeleteTodoClick(this)'  msgId='" + msgId + "' msgGuid='" + msgItemId + "' ><i class='fa fa-times'></i></button>";
    var oneContent = "<div class='form-group'>" +
        "<div class='col-sm-1'>" +
        "<input type='checkbox' class='form-control' msgId='" + msgId + "' onclick='ToDoIsDone(this)' msgGuid='" + msgItemId + "' " + disabled + "/>" +
        "</div>" +
        "<div class='col-sm-9'>" +
        "<input type='text' class='form-control' value='" + msgContent + "' msgGuid='" + msgItemId + "' id='ip_todo_content_" + msgItemId + "'  />" +
        "</div>" +
        "<div class='col-sm-2 center'>" + btnSaveUpdate + btnDelete +
        "</div>" +
        "</div>";
    $('#div_todo_list').append(oneContent);
}

function DeleteTodoClick(sender) {
    var msgGuid = $(sender).attr('msgGuid');
    var msgId = $(sender).attr('msgId');
    MsgPopUpWithResponseChoice('CONFIRMATION', 'Veuillez confirmer la suppression', 'SUPPRIMER', 'DeleteTodo(' + msgId + ',"' + msgGuid + '")', 'Annuler');
    return false;
}

function DeleteTodo(msgId, msgGuid) {
    var oneMsgItem = {};
    oneMsgItem.MsgId = msgId * 1;
    oneMsgItem.Id = msgGuid;
    oneMsgItem.Content = '';
    oneMsgItem.IsRead = true;
    oneMsgItem.IsTreated = false;

    var jsondata = JSON.stringify({ msgItem: oneMsgItem });
    var url = window.webservicePath + "/DeleteMessage";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $('#div_done_list').empty();
                $('#div_todo_list').empty();
                SetToDoList(data2Treat);
            } else {
                AuthencationError();
            }
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
    return false;
}


function CreateUpdateTodo(sender) {
    var msgGuid = $(sender).attr('msgGuid');
    var msgId = $(sender).attr('msgId');
    var content = $('#ip_todo_content_' + msgGuid).val();
    if (content) {
        $('#ip_todo_content_' + msgGuid).removeClass('error_border');
        var oneMsgItem = {};
        oneMsgItem.MsgId = msgId * 1;
        oneMsgItem.Id = msgGuid;
        oneMsgItem.Content = content;
        oneMsgItem.IsRead = false;
        oneMsgItem.IsTreated = false;
        ShowPleaseWait();
        var jsondata = JSON.stringify({ msgItem: oneMsgItem });
        var url = window.webservicePath + "/CreateUpdateToDo";
        $.ajax({
            url: url,
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            data: jsondata,
            dataType: 'json',
            success: function (data) {
                var jsdata = data.d;
                var data2Treat = jQuery.parseJSON(jsdata);
                if (data2Treat !== '-1') {
                    $('#div_done_list').empty();
                    $('#div_todo_list').empty();
                    SetToDoList(data2Treat);
                } else {
                    AuthencationError();
                }
                HidePleaseWait();
            },
            error: function (data) {
                HidePleaseWait();
                alert(data.responseText);
            }
        });
    } else {
        $('#ip_todo_content_' + msgGuid).addClass('error_border');
    }
    return false;
}

function ToDoIsDone(sender) {
    var isDone = $(sender).is(':checked');
    var msgGuid = $(sender).attr('msgGuid');
    var msgId = $(sender).attr('msgId');
    var oneMsgItem = {};
    oneMsgItem.MsgId = msgId * 1;
    oneMsgItem.Id = msgGuid;
    oneMsgItem.Content = '';
    oneMsgItem.IsRead = true;
    oneMsgItem.IsTreated = isDone;

    var jsondata = JSON.stringify({ msgItem: oneMsgItem });
    var url = window.webservicePath + "/UpdateToDoStatus";
    $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        data: jsondata,
        dataType: 'json',
        success: function (data) {
            var jsdata = data.d;
            var data2Treat = jQuery.parseJSON(jsdata);
            if (data2Treat !== '-1') {
                $('#div_done_list').empty();
                $('#div_todo_list').empty();
                SetToDoList(data2Treat);
            } else {
                AuthencationError();
            }
        },
        error: function (data) {
            alert(data.responseText);
        }
    });
    return false;
}