const tableBody = document.querySelector("#randevu-table tbody");

fetch("http://localhost:5000/api/randevular")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Veri alınamadı!");
    }
    return response.json();
  })
  .then((data) => {
    console.log(data); // Gelen veriyi kontrol et
    if (data.length === 0) {
      tableBody.innerHTML = "<tr><td colspan='6'>Henüz randevu yok.</td></tr>";
    } else {
      // Gelen veriyi tabloya ekle
      tableBody.innerHTML = data
        .map(
          (randevu) => `
          <tr>
            <td>${randevu.id}</td>
            <td>${randevu.hasta_id}</td>
            <td>${randevu.doktor_id}</td>
            <td>${randevu.oda_id}</td>
            <td>${randevu.durum_id}</td>
            <td>${new Date(randevu.randevu_tarihi).toLocaleDateString()}</td>
            <td><button class="delete-btn" data-id="${randevu.id}">Sil</button></td>
            <td><button class="update-btn" data-id="${randevu.id}">Güncelle</button></td>
          </tr>
        `
        )
        .join("");
    }
  })
  .catch((error) => {
    console.error("Hata:", error);
    tableBody.innerHTML = "<tr><td colspan='6'>Veriler alınırken bir hata oluştu.</td></tr>";
  });

const addRandevuBtn = document.getElementById("addRandevuBtn");
const popupOverlay = document.getElementById("popupOverlay");
const popupForm = document.getElementById("popupForm");
const closePopup = document.getElementById("closePopup");
const randevuForm = document.getElementById("randevuForm");

// Pop-up açma
addRandevuBtn.addEventListener("click", () => {
  popupOverlay.classList.add("active");
  popupForm.classList.add("active");

  // Doktor, Hasta, Oda ve Durum seçeneklerini doldur
  fetch("http://localhost:5000/api/doktorlar")
    .then((response) => response.json())
    .then((doktorlar) => {
      const doktorSelect = document.getElementById("doktor");
      doktorSelect.innerHTML = doktorlar
        .map(
          (doktor) =>
            `<option value="${doktor.id}">${doktor.adi} ${doktor.soyadi}</option>`
        )
        .join("");
    });


  fetch("http://localhost:5000/api/hastalar")
    .then((response) => response.json())
    .then((hastalar) => {
      const hastaSelect = document.getElementById("hasta");
      hastaSelect.innerHTML = hastalar
        .map(
          (hasta) =>
            `<option value="${hasta.id}">${hasta.adi} ${hasta.soyadi}</option>`
        )
        .join("");
    });

  fetch("http://localhost:5000/api/odalar")
    .then((response) => response.json())
    .then((odalar) => {
      const odaSelect = document.getElementById("oda");
      odaSelect.innerHTML = odalar
        .filter((oda) => oda.durum === "Boş") // Sadece boş odalar
        .map((oda) => `<option value="${oda.id}">${oda.numarasi}</option>`)
        .join("");
    });

  fetch("http://localhost:5000/api/randevudurumlari")
    .then((response) => response.json())
    .then((durumlar) => {
      const durumSelect = document.getElementById("durum");
      durumSelect.innerHTML = durumlar
        .map((durum) => `<option value="${durum.id}">${durum.durum_adi}</option>`)
        .join("");
    });
});

// Pop-up kapama
closePopup.addEventListener("click", () => {
  popupOverlay.classList.remove("active");
  popupForm.classList.remove("active");
});

// Form gönderme
randevuForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(randevuForm);
  const randevuData = {
    doktor_id: formData.get("doktor"),
    hasta_id: formData.get("hasta"),
    oda_id: formData.get("oda"),
    durum_id: formData.get("durum"),
    randevu_tarihi: formData.get("tarih"),
  };

  console.log("Gönderilecek veri:", randevuData); // Kontrol için

  fetch("http://localhost:5000/api/randevular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(randevuData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Randevu eklenemedi.");
      }
      return response.json();
    })
    .then((newRandevu) => {
      console.log("Yeni randevu eklendi:", newRandevu);
      // Tabloyu güncelleme işlemi burada yapılabilir
      window.location.reload(); // Sayfayı tamamen yeniden yükler

    })
    .catch((error) => console.error("Hata:", error));
});
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const randevuId = e.target.getAttribute("data-id");

    // Kullanıcıdan onay al
    if (confirm("Bu randevuyu silmek istediğinize emin misiniz?")) {
      fetch(`http://localhost:5000/api/randevular/${randevuId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Randevu silinemedi.");
          }
          return response.json();
        })
        .then((data) => {
          console.log(data.message); // Başarı mesajını konsola yazdır
          // Tabloyu yeniden yükle
          window.location.reload(); // Sayfayı tamamen yeniden yükler
        })
        .catch((error) => console.error("Hata:", error));
    }
  }
});
const doktorButton = document.getElementById("doktorButton");
const hastaButton = document.getElementById("hastaButton");
const infoTable = document.getElementById("infoTable");

// Doktor bilgilerini yükleme
doktorButton.addEventListener("click", () => {
  fetch("http://localhost:5000/api/doktor-bilgileri")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Doktor bilgileri alınamadı!");
      }
      return response.json();
    })
    .then((data) => {
      infoTable.innerHTML = `
        <table>
          <thead>
            <tr>              
              <th>Kullanıcı ID</th>
              <th>Ad</th>
              <th>Soyad</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Kayıt Tarihi</th>
              <th>Klinik Adı</th>
            </tr>
          </thead>
          <tbody>
            ${data
          .map(
            (doktor) => `
                <tr>
                  <td>${doktor.kullanici_id}</td>
                  <td>${doktor.adi}</td>
                  <td>${doktor.soyadi}</td>
                  <td>${doktor.email}</td>
                  <td>${doktor.telefon}</td>
                  <td>${new Date(doktor.kayit_tarihi).toLocaleDateString()}</td>
                  <td>${doktor.klinik_adi}</td>
                </tr>`
          )
          .join("")}
          </tbody>
        </table>
      `;
    })
    .catch((error) => {
      console.error("Hata:", error);
      infoTable.innerHTML = "<p>Doktor bilgileri yüklenirken bir hata oluştu.</p>";
    });
});

// Hasta bilgilerini yükleme
hastaButton.addEventListener("click", () => {
  fetch("http://localhost:5000/api/hasta-bilgileri")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Hasta bilgileri alınamadı!");
      }
      return response.json();
    })
    .then((data) => {
      infoTable.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Kullanıcı ID</th>
              <th>Ad</th>
              <th>Soyad</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            ${data
          .map(
            (hasta) => `
                <tr>
                  <td>${hasta.kullanici_id}</td>
                  <td>${hasta.adi}</td>
                  <td>${hasta.soyadi}</td>
                  <td>${hasta.email}</td>
                  <td>${hasta.telefon}</td>
                  <td>${new Date(hasta.kayit_tarihi).toLocaleDateString()}</td>
                </tr>`
          )
          .join("")}
          </tbody>
        </table>
      `;
    })
    .catch((error) => {
      console.error("Hata:", error);
      infoTable.innerHTML = "<p>Hasta bilgileri yüklenirken bir hata oluştu.</p>";
    });
});
// Arama çubuğunu ve tabloyu seç
const searchInput = document.getElementById("searchInput");
const table = document.getElementById("infoTable");

// Arama çubuğuna yazıldığında tabloyu filtrele
searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase(); // Küçük harfe çevir
  const rows = table.getElementsByTagName("tr"); // Tablo satırlarını al

  for (let i = 1; i < rows.length; i++) { // Başlık satırını atla
    const cells = rows[i].getElementsByTagName("td");
    let rowContainsFilter = false;

    for (let j = 0; j < cells.length; j++) {
      if (cells[j].textContent.toLowerCase().includes(filter)) {
        rowContainsFilter = true;
        break;
      }
    }

    rows[i].style.display = rowContainsFilter ? "" : "none"; // Filtreye uymayan satırları gizle
  }
});
const updatePopupOverlay = document.getElementById("updatePopupOverlay");
const updatePopupForm = document.getElementById("updatePopupForm");
const updateRandevuForm = document.getElementById("updateRandevuForm");
const closeUpdatePopup = document.getElementById("closeUpdatePopup");

// Güncelleme butonuna tıklanınca pop-up açılır ve mevcut bilgiler yüklenir
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("update-btn")) {
    const randevuId = e.target.getAttribute("data-id");

    // Randevu bilgilerini al
    fetch(`http://localhost:5000/api/randevular/${randevuId}`)
      .then((response) => response.json())
      .then((randevu) => {
        if (!randevu) {
          throw new Error("Randevu bulunamadı!");
        }

        // Doktor, hasta, oda ve durum seçeneklerini doldur
        fetch("http://localhost:5000/api/doktorlar")
          .then((response) => response.json())
          .then((doktorlar) => {
            const doktorSelect = document.getElementById("updateDoktor");
            doktorSelect.innerHTML = doktorlar
              .map(
                (doktor) =>
                  `<option value="${doktor.id}" ${doktor.id === randevu.doktor_id ? "selected" : ""
                  }>${doktor.adi} ${doktor.soyadi}</option>`
              )
              .join("");
          });

        fetch("http://localhost:5000/api/hastalar")
          .then((response) => response.json())
          .then((hastalar) => {
            const hastaSelect = document.getElementById("updateHasta");
            hastaSelect.innerHTML = hastalar
              .map(
                (hasta) =>
                  `<option value="${hasta.id}" ${hasta.id === randevu.hasta_id ? "selected" : ""
                  }>${hasta.adi} ${hasta.soyadi}</option>`
              )
              .join("");
          });

          fetch("http://localhost:5000/api/odalar")
          .then((response) => response.json())
          .then((odalar) => {
            const odaSelect = document.getElementById("updateOda");
            odaSelect.innerHTML = odalar
              .filter(
                (oda) =>
                  oda.durum === "Boş" || oda.id === randevu.oda_id // Mevcut odanın da seçilebilir olması için kontrol
              )
              .map(
                (oda) =>
                  `<option value="${oda.id}" ${
                    oda.id === randevu.oda_id ? "selected" : ""
                  }>${oda.numarasi}</option>`
              )
              .join("");
          });

        fetch("http://localhost:5000/api/randevudurumlari")
          .then((response) => response.json())
          .then((durumlar) => {
            const durumSelect = document.getElementById("updateDurum");
            durumSelect.innerHTML = durumlar
              .map(
                (durum) =>
                  `<option value="${durum.id}" ${durum.id === randevu.durum_id ? "selected" : ""
                  }>${durum.durum_adi}</option>`
              )
              .join("");
          });

        // Tarih alanını doldur
        document.getElementById("updateTarih").value = new Date(
          randevu.randevu_tarihi
        )
          .toISOString()
          .split("T")[0];

        // Pop-up'u aç
        updatePopupOverlay.classList.add("active");
        updatePopupForm.classList.add("active");

        // Güncelleme için randevu ID'sini formda sakla
        updatePopupForm.setAttribute("data-id", randevuId);
      })
      .catch((error) => {
        console.error("Hata:", error);
        alert("Randevu bilgileri yüklenirken bir hata oluştu.");
      });
  }
});
// Güncelleme formu gönderilince API'ye PUT isteği gönder
updateRandevuForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const randevuId = updatePopupForm.getAttribute("data-id");
  const formData = new FormData(updateRandevuForm);
  const updatedRandevu = {
    doktor_id: formData.get("doktor"),
    hasta_id: formData.get("hasta"),
    oda_id: formData.get("oda"),
    durum_id: formData.get("durum"),
    randevu_tarihi: formData.get("tarih"),
  };

  fetch(`http://localhost:5000/api/randevular/${randevuId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedRandevu),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Randevu güncellenemedi.");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data.message);
      // Pop-up'u kapat
      updatePopupOverlay.classList.remove("active");
      updatePopupForm.classList.remove("active");
      window.location.reload(); // Sayfayı tamamen yeniden yükler
      alert("Randevu başarıyla güncellendi!");
    })
    .catch((error) => console.error("Hata:", error));
});
// Pop-up'ı kapatma
closeUpdatePopup.addEventListener("click", () => {
  updatePopupOverlay.classList.remove("active");
  updatePopupForm.classList.remove("active");

  // Güncelleme formunu temizleme
  updateRandevuForm.reset();
});
