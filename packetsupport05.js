(function() {
    'use strict';

    if (!window.location.href.includes('screen=place&mode=call')) {
        alert("Run on Mass Support screen (Rally point → Mass support)!");
        return;
    }

    const DEFENSE_UNITS = ["spear", "sword", "archer", "heavy"];
    const HEAVY_POP_DEFAULT = 6;
    const POP_PER_K = 1000;

    const UNIT_LABELS = {
        spear: "Spears",
        sword: "Swords",
        archer: "Archers",
        spy: "Scouts",
        heavy: "Heavies"
    };

    // === CREATE EMBEDDED TABLE ROW ===
    const targetTable = document.querySelector('#place_call_form');
    if (!targetTable) {
        alert("Could not find the main form - make sure you're on Mass Support!");
        return;
    }

    const containerRow = document.createElement('tr');
    const containerCell = document.createElement('td');
    containerCell.colSpan = '14'; // span full width of the table
    containerCell.style.padding = '15px 0';
    containerCell.style.background = '#1a1a2e';
    containerCell.style.borderTop = '2px solid #4a6fa5';
    containerCell.style.borderBottom = '2px solid #4a6fa5';

    const innerDiv = document.createElement('div');
    innerDiv.style.maxWidth = '800px';
    innerDiv.style.margin = '0 auto';
    innerDiv.style.padding = '0 20px';

    // Title
    innerDiv.innerHTML = `
        <h3 style="margin:0 0 15px; text-align:center; color:#8ab4f8; font-size:20px;">
            PacketSender by Crim
        </h3>
        <hr style="border-color:#4a6fa5; margin:10px 0;">
    `;

    const formWrapper = document.createElement('div');
    formWrapper.style.display = 'flex';
    formWrapper.style.flexDirection = 'column';
    formWrapper.style.gap = '14px';

    formWrapper.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div>
                <label style="font-weight:bold; display:block; margin-bottom:5px;">Total defense pop to send (k):</label>
                <input type="number" id="gui-total-k" value="10" min="1" step="1" style="width:100%; padding:8px; font-size:15px; background:#222244; color:#e0e0ff; border:1px solid #4a6fa5; border-radius:4px;">
            </div>
            <div>
                <label style="font-weight:bold; display:block; margin-bottom:5px;">Max packet size per village (k pop):</label>
                <input type="number" id="gui-packet-k" value="1" min="0.5" step="0.5" style="width:100%; padding:8px; font-size:15px; background:#222244; color:#e0e0ff; border:1px solid #4a6fa5; border-radius:4px;">
            </div>
        </div>

        <div>
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Max scouts/spies to send per village:</label>
            <input type="number" id="gui-max-spy" value="50" min="0" step="1" style="width:100%; padding:8px; font-size:15px; background:#222244; color:#e0e0ff; border:1px solid #4a6fa5; border-radius:4px;">
        </div>

        <div>
            <label style="font-weight:bold; display:block; margin-bottom:5px;">Heavy Pop Count:</label>
            <input type="number" id="gui-heavy-pop" value="6" min="1" step="1" style="width:100%; padding:8px; font-size:15px; background:#222244; color:#e0e0ff; border:1px solid #4a6fa5; border-radius:4px;">
        </div>

        <div style="margin-top:10px;">
            <strong style="display:block; margin-bottom:8px;">Reserves per village (units to keep):</strong>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px;">
                ${units.map(u => `
                    <div>
                        <label style="font-size:0.9em;">${u.label}</label>
                        <input type="number" class="gui-reserve" data-unit="${u.key}" value="${u.def}" min="0" style="width:100%; padding:8px; font-size:14px; background:#222244; color:#e0e0ff; border:1px solid #4a6fa5; border-radius:4px;">
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Result area
    const resultDiv = document.createElement('div');
    resultDiv.id = 'gui-result';
    resultDiv.style.marginTop = '20px';
    resultDiv.style.padding = '12px';
    resultDiv.style.background = 'rgba(0,0,0,0.4)';
    resultDiv.style.borderRadius = '6px';
    resultDiv.style.display = 'none';
    formWrapper.appendChild(resultDiv);

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '12px';
    btnContainer.style.marginTop = '20px';

    const sendBtn = document.createElement('button');
    sendBtn.textContent = "Send Packets";
    sendBtn.style.cssText = `
        flex:1; padding:12px; font-size:16px; font-weight:bold;
        background:#4a6fa5; color:white; border:none; border-radius:6px;
        cursor:pointer;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = "Close GUI";
    closeBtn.style.cssText = `
        flex:1; padding:12px; font-size:16px;
        background:#555; color:white; border:none; border-radius:6px;
        cursor:pointer;
    `;

    btnContainer.appendChild(sendBtn);
    btnContainer.appendChild(closeBtn);

    formWrapper.appendChild(btnContainer);
    content.appendChild(formWrapper);

    // Insert the new row right after the main form
    const insertPoint = targetTable.parentElement;
    insertPoint.insertBefore(containerRow, targetTable.nextSibling);
    containerRow.appendChild(containerCell);
    containerCell.appendChild(innerDiv);
    innerDiv.appendChild(formWrapper);

    // === COOKIE HANDLING ===
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function setCookie(name, value) {
        document.cookie = `${name}=${value}; path=/; max-age=31536000`;
    }

    // Load saved values
    ['gui-total-k', 'gui-packet-k', 'gui-max-spy', 'gui-heavy-pop'].forEach(id => {
        const saved = getCookie(`ps_${id}`);
        if (saved) document.getElementById(id).value = saved;
    });

    document.querySelectorAll('.gui-reserve').forEach(inp => {
        const saved = getCookie(`ps_reserve_${inp.dataset.unit}`);
        if (saved) inp.value = saved;
    });

    // Save on input change
    document.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('change', () => {
            if (inp.id) setCookie(`ps_${inp.id}`, inp.value);
            else if (inp.classList.contains('gui-reserve')) {
                setCookie(`ps_reserve_${inp.dataset.unit}`, inp.value);
            }
        });
    });

    // Close button
    closeBtn.onclick = () => {
        containerRow.remove();
    };

    // === SEND LOGIC ===
    sendBtn.onclick = () => {
        const totalK = parseFloat(document.getElementById('gui-total-k').value) || 0;
        const maxPacketK = parseFloat(document.getElementById('gui-packet-k').value) || 1;
        const maxSpyPerVillage = parseInt(document.getElementById('gui-max-spy').value) || 50;
        const heavyPop = parseInt(document.getElementById('gui-heavy-pop').value) || 6;

        if (totalK <= 0 || maxPacketK <= 0 || heavyPop <= 0) {
            alert("Enter valid positive numbers.");
            return;
        }

        const TOTAL_DEFENSE_TARGET = Math.round(totalK * 1000);
        const MAX_PACKET_DEFENSE = Math.round(maxPacketK * 1000);

        const reserve = {};
        document.querySelectorAll('.gui-reserve').forEach(i => {
            reserve[i.dataset.unit] = parseInt(i.value) || 0;
        });

        // Collect
        const villages = [];
        let totalAvailDefensePop = 0;

        document.querySelectorAll("#village_troup_list tbody tr.call-village").forEach(row => {
            const coordEl = row.querySelector("td:first-child a");
            if (!coordEl) return;
            const coordMatch = coordEl.textContent.match(/\(?(\d+\|\d+)\)?/);
            if (!coordMatch) return;
            const coord = coordMatch[1];

            let defensePop = 0;
            const availTroops = {};
            let availSpies = 0;

            ["spear","sword","archer","spy","heavy"].forEach(u => {
                const cell = row.querySelector(`td[data-unit="${u}"]`);
                if (!cell) return;
                const span = cell.querySelector(".call-unit-count");
                let txt = span?.textContent?.trim() || "0";

                if (/k/i.test(txt)) txt = txt.replace(/k/i,"000").replace(/[.,]/g,"");
                txt = txt.replace(/[^0-9]/g,"");

                const total = parseInt(txt) || 0;
                const res = reserve[u] || 0;
                const avail = Math.max(0, total - res);

                availTroops[u] = avail;

                if (u === "spy") {
                    availSpies = avail;
                } else {
                    defensePop += (u === "heavy" ? avail * heavyPop : avail);
                }
            });

            if (defensePop > 0 || availSpies > 0) {
                villages.push({
                    coord,
                    availTroops,
                    defensePop,
                    availSpies,
                    rowElement: row
                });
                totalAvailDefensePop += defensePop;
            }
        });

        if (villages.length === 0) {
            alert("No villages with defense troops or scouts after reserves.");
            return;
        }

        const globalScale = TOTAL_DEFENSE_TARGET / totalAvailDefensePop;

        villages.forEach(v => {
            const villageDefenseMax = Math.floor(v.defensePop * globalScale);
            const packetDefenseCap = Math.min(villageDefenseMax, MAX_PACKET_DEFENSE);

            const packet = {};
            let packetDefensePop = 0;

            const totalDefenseThis = v.defensePop || 1;

            DEFENSE_UNITS.forEach(u => {
                let amt = 0;

                if (v.availTroops[u] > 0) {
                    const proportion = v.availTroops[u] / totalDefenseThis;
                    const raw = proportion * packetDefenseCap;
                    amt = Math.trunc(raw);
                    amt = Math.min(amt, v.availTroops[u]);
                }

                if (v.availTroops[u] <= 0) {
                    amt = 0;
                }

                packet[u] = amt;
                packetDefensePop += (u === "heavy" ? amt * heavyPop : amt);
            });

            if (packetDefensePop > MAX_PACKET_DEFENSE) {
                const ratio = MAX_PACKET_DEFENSE / packetDefensePop;
                DEFENSE_UNITS.forEach(u => {
                    packet[u] = Math.trunc(packet[u] * ratio);
                });
                packetDefensePop = DEFENSE_UNITS.reduce((s,u) => {
                    const a = packet[u] || 0;
                    return s + (u === "heavy" ? a * heavyPop : a);
                }, 0);
            }

            let spyAmt = Math.floor((v.availSpies / (totalDefenseThis + v.availSpies || 1)) * packetDefenseCap);
            spyAmt = Math.min(spyAmt, maxSpyPerVillage, v.availSpies);
            packet.spy = spyAmt;

            v.packet = packet;
            v.packetPop = packetDefensePop;
        });

        // === FILLING ===
        villages.forEach(v => {
            const row = v.rowElement;
            if (!row) return;

            // Clear all
            ["spear","sword","archer","spy","heavy"].forEach(u => {
                const inp = row.querySelector(`input[name^="call["][name$="[${u}]"]`);
                if (inp) {
                    inp.value = "0";
                    inp.dispatchEvent(new Event('input', {bubbles:true}));
                    inp.dispatchEvent(new Event('change', {bubbles:true}));
                }
            });

            // Check row if sending something
            const cb = row.querySelector('input.troop-request-selector');
            const isSending = Object.values(v.packet).some(a => a > 0);
            if (isSending && cb && !cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event('change', {bubbles:true}));
                cb.dispatchEvent(new Event('click', {bubbles:true}));
            } else if (cb) {
                cb.checked = false;
            }

            // Fill after delay
            setTimeout(() => {
                Object.entries(v.packet).forEach(([u, amt]) => {
                    const inp = row.querySelector(`input[name^="call["][name$="[${u}]"]`);
                    if (inp) {
                        inp.disabled = false;
                        inp.value = amt;
                        inp.dispatchEvent(new Event('input', {bubbles:true}));
                        inp.dispatchEvent(new Event('change', {bubbles:true}));
                    }
                });
            }, 400); // 400ms delay - should be enough for game to enable fields
        });

        // Results
        const sentDefenseTotal = villages.reduce((s,v)=>s+v.packetPop,0);
        const sentDefenseK = (sentDefenseTotal / 1000).toFixed(1);
        const filled = villages.filter(v=> Object.values(v.packet).some(a=>a>0)).length;

        let unitTotals = {spear:0, sword:0, archer:0, spy:0, heavy:0};
        villages.forEach(v => {
            Object.keys(unitTotals).forEach(u => {
                unitTotals[u] += v.packet[u] || 0;
            });
        });

        const resultHTML = `
            <strong style="color:#8ab4f8;">Results:</strong><br>
            Filled villages: <b>${filled}</b><br>
            Total defense sent (excl. scouts): <b>${sentDefenseK}k</b> pop (requested ${totalK}k)<br>
            <br>
            <strong>Units sent total:</strong><br>
            Spears: <b>${unitTotals.spear.toLocaleString()}</b><br>
            Swords: <b>${unitTotals.sword.toLocaleString()}</b><br>
            Archers: <b>${unitTotals.archer.toLocaleString()}</b><br>
            Scouts: <b>${unitTotals.spy.toLocaleString()}</b> (max ${maxSpyPerVillage} per village)<br>
            Heavies: <b>${unitTotals.heavy.toLocaleString()}</b><br>
        `;

        document.getElementById('gui-result').innerHTML = resultHTML;
        document.getElementById('gui-result').style.display = 'block';

        UI.SuccessMessage(
            `Success! Check embedded results below.<br>Defense sent: <b>${sentDefenseK}k</b> pop`,
            8000
        );
    };
})();