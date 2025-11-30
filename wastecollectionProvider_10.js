//<provider>10</provider><version>1.0.2</version><parms>"city,streetName"</parms>
//provider limburg.net testdata: Hasselt Bakkerslaan

	function readCalendar(wasteZipcode, wasteHouseNr, extraDates, enableCreateICS, wasteICSId, wasteStreet, wasteStreetName, wasteCity, wasteFullICSUrl) {
	
		wasteDatesString = "";
		var wasteType = "";
		var limburgAfvalbeheerDates = [];

			// retrieve city id

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			
			if (xmlhttp.readyState == XMLHttpRequest.DONE) {
				
				if (xmlhttp.responseText !== "[]") {

						// retrieve street id
	
					var i = xmlhttp.responseText.indexOf("}");
					var cityNumbers = JSON.parse(xmlhttp.responseText.substring(1,i+1));
					if (wasteCity !== cityNumbers["naam"]) {
						wasteCity = cityNumbers["naam"];
					}

					var xmlhttp2 = new XMLHttpRequest();
					xmlhttp2.onreadystatechange = function() {
						if (xmlhttp2.readyState == XMLHttpRequest.DONE) {

							var i = xmlhttp2.responseText.indexOf("}");
							var streetNumbers = JSON.parse(xmlhttp2.responseText.substring(1,i+1));
							if (streetNumbers["nummer"]) {
								if (wasteStreetName !== streetNumbers["naam"]) {
									wasteStreetName = streetNumbers["naam"];
								}

									// retrieve collection dates

								var xmlhttp3 = new XMLHttpRequest();
								xmlhttp3.onreadystatechange = function() {
									if (xmlhttp3.readyState == XMLHttpRequest.DONE) {
										var aNode = xmlhttp3.responseText;

											// read specific waste collection dates

										i = aNode.indexOf("BEGIN:VEVENT")
										i = aNode.indexOf("DTSTART", i);
										var j = 0;

										if (i > 0) {
											if (aNode.substring(i, i+18) == "DTSTART;VALUE=DATE") i = i + 11;
										}

										if ( i > 0 ) {
											while (i > 0) {
												j = aNode.indexOf("SUMMARY", i);

												wasteType = wasteTypeLimburg(aNode.substring(j+8, j+11));
												limburgAfvalbeheerDates.push(aNode.substring(i+8, i+12) + "-" + aNode.substring(i+12, i+14) + "-" + aNode.substring(i+14, i+16) + "," + wasteType);
				
												i = aNode.indexOf("BEGIN:VEVENT", j);  // skip VALARMS
												if (i > 0) {
													i = aNode.indexOf("DTSTART", i);
													if (i > 0) {
														if (aNode.substring(i, i+18) == "DTSTART;VALUE=DATE") i = i + 11;
													}
												}
											}
										}
										var tmp = sortArray2(limburgAfvalbeheerDates, extraDates);

										for (i = 0; i < tmp.length; i++) {
											wasteDatesString = wasteDatesString + tmp[i] + "\n";
										}
										writeWasteDates(wasteDatesString, enableCreateICS);
									}
								}
								xmlhttp3.open("GET", "https://www.limburg.net/api-proxy/public/kalender-download/ical/" + cityNumbers["nisCode"] + "?straatNummer=" + streetNumbers["nummer"], true);
								xmlhttp3.send();
							}
						}
					}
					xmlhttp2.open("GET", "https://limburg.net/api-proxy/public/afval-kalender/gemeente/" + cityNumbers["nisCode"] + "/straten/search?query=" + wasteStreetName, true);
					xmlhttp2.send();
				}
			}
		}
		xmlhttp.open("GET", "https://limburg.net/api-proxy/public/afval-kalender/gemeenten/search?query=" + wasteCity, true);
		xmlhttp.send();
	}

	function wasteTypeLimburg(shortName) {
		switch (shortName) {
			case "Tex": return 5;		//textiel
			case "Gft": return 3;		//gft
			case "Hui": return 0;		//huisvuil
			case "Pap": return 2;		//papier en karton
			case "Pmd": return 1;		//plastic metaal drankpakken
			case "tui": return 4;		//tuinafval
			case "ker": return 4;		//tuinafval - kerstboom

			default: break;
		}
		return "?";
	}

	function sortArray2(inputarray, extraDates) {
	
			var newArray = inputarray.concat(extraDates);
			newArray.sort();

			return newArray;
	}

	function writeWasteDates(wasteDatesString, enableCreateICS) {
   		var doc2 = new XMLHttpRequest();
   		doc2.open("PUT", "file:///var/volatile/tmp/wasteDates.txt");
		doc2.onreadystatechange=function() {
			if (doc2.readyState === 4){
				if (doc2.status === 0) {
					updateWasteIcon("no");
				}
			}
		}
   		doc2.send(wasteDatesString);

		// create ICS file for use in the calendar app when requested

		if (enableCreateICS) {
			var outputICS = "";
			var tmpICS = wasteDatesString.split("\n");

			for (var i = 0; i < tmpICS.length; i++) {
				if (tmpICS[i].length > 10) { 
					outputICS = outputICS + "BEGIN:VEVENT\r\n";
					outputICS = outputICS + "DTSTART;VALUE=DATE:" + tmpICS[i].substring(0,4) + tmpICS[i].substring(5,7) + tmpICS[i].substring(8,10) + "\r\n";
					outputICS = outputICS + "SUMMARY:" + wasteTypeFriendlyName(tmpICS[i].substring(11,12)) + "\r\n";
					outputICS = outputICS + "BEGIN:VEVENT\r\n";
				}
			}
   			var doc3 = new XMLHttpRequest();
   			doc3.open("PUT", "file:///var/volatile/tmp/wasteDates.ics");
   			doc3.send(outputICS);

		}
	}

