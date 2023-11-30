function onCreate() {
  setInitiator();
  setEmployees();
  setContractorHome();
}

function setInitiator() {
  /* {
  var data = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.attributeValues;
  if (data) {
    var initiatorLogin = EdocsApi.findElementByProperty("code", "InitiatorName", data)?.value;
    var initiatorId = EdocsApi.getEmployeeDataByEmployeeUserLogin(initiatorLogin)?.employeeId;
    if (initiatorId) EdocsApi.setAttributeValue({ code: "InitiatorName", value: initiatorId, text: null });
  }
}*/

  if (CurrentDocument.inExtId) {
    const attr = EdocsApi.getInExtAttributes(CurrentDocument.id.toString());
    if (attr && attr.attributeValues) {
      const login = attr.attributeValues.find((x) => x.code == "InitiatorName")?.value;
      if (login) {
        const user = EdocsApi.getEmployeeDataByEmployeeUserLogin(login);
        if (user) {
          EdocsApi.setAttributeValue({ code: "InitiatorName1", value: user.employeeId.toString(), text: null });
        }
      }
    }
  }
}

function setContractorHome() {
  var attr = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.attributeValues;
  if (attr) {
    var EDRPOU = EdocsApi.findElementByProperty("code", "OrganizationEDRPOU", dataEDRPOU)?.value;
    var dataContractorHome = EdocsApi.getContractorByCode(EDRPOU, "homeOrganization");
    if (dataContractorHome) {
      EdocsApi.setAttributeValue({ code: "OrganizationShortName", value: dataContractorHome.shortName, text: null });
      EdocsApi.setAttributeValue({ code: "OrganizationNameIdentificator", value: dataContractorHome.authorisedPersons.find((x) => x)?.id, text: null });
    }
  }
}

function onChangeOrganizationEDRPOU() {
  var OrganizationEDRPOU = EdocsApi.getAttributeValue("OrganizationEDRPOU").value;
  var MembersCommissions = EdocsApi.getAttributeValue("MembersCommissions").value;
  if (MembersCommissions) {
    var employeeId = JSON.parse(MembersCommissions)?.[0].employeeId;
    if (employeeId) setEmployees(OrganizationEDRPOU, EdocsApi.getEmployeeDataByEmployeeID(employeeId)?.employeeLogin);
  } else {
    setEmployees(OrganizationEDRPOU);
  }
}

function setEmployees(EDRPOU = "", employeeLogin = "") {
  debugger;

  //1.визначити ЄДРПОУ
  if (!EDRPOU) {
    var dataEDRPOU = EdocsApi.getInExtAttributes(CurrentDocument.id.toString())?.attributeValues;
    if (dataEDRPOU) {
      EDRPOU = EdocsApi.findElementByProperty("code", "OrganizationEDRPOU", dataEDRPOU)?.value;
    }
  }

  //2.запит до довідника (масив підписантів)
  var data = EdocsApi.getDictionaryData("MembersСommissionsAct", "", [{ attributeCode: "Title", value: EDRPOU }]);
  if (data.length > 0) {
    data = data.find((x) => x).value;
    if (data.endsWith(",")) data = data.slice(0, -1);
    var array = data.split(", ");

    //3.порівняти наявність одного підписанта у довіднику (масив підписантів), якщо підписант є, то вихід
    if (employeeLogin && array.includes(employeeLogin)) {
      return;
    }

    //4. то записати нових підписантів
    var employeeText = null;
    var employee = [];
    for (let index = 0; index < array.length; index++) {
      var employeeByLogin = EdocsApi.getEmployeeDataByEmployeeUserLogin(array[index]);
      if (employeeByLogin) {
        employee.push({
          id: 0,
          employeeId: employeeByLogin.employeeId,
          index: index, //потрібно збільшувати на 1
          employeeName: employeeByLogin.shortName,
          positionName: employeeByLogin.positionName,
        });
        employeeText ? (employeeText = employeeText + "\n" + employeeByLogin.positionName + "\t" + employeeByLogin.shortName) : (employeeText = employeeByLogin.positionName + "\t" + employeeByLogin.shortName);
      }
    }
    debugger;

    EdocsApi.setAttributeValue({
      code: "MembersCommissions",
      value: JSON.stringify(employee),
      text: employeeText,
    });
  }
}
