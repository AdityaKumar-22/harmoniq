async function getSongs(folder) {
  currFolder = folder;
  // let a = await fetch(`http://192.168.1.39:3000/js_tutorials/spotfiy_clone/songs/${folder}`);
  let a = await fetch(`songs/${folder}`);
  let response = await a.text();
  console.log(response);

  let div = document.createElement("div");
  div.innerHTML = response;

  //getting all songs href
  let anchors = div.getElementsByTagName("a");
  let songs = [];
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i].href.endsWith(".mp3")) {
      songs.push(anchors[i].href);
    }
  }
  //adding to left-box songList
  let songUL = document.querySelector(".songList");
  songUL.innerHTML = "";
  for (const song of songs) {
    let songDetails = song
      .split(`/${folder}/`)[1]
      .replaceAll("%20", " ")
      .replace(".mp3", "")
      .split(` - `);
    songUL.innerHTML += `<li class="flex">
                        <img src="assests/images/list-music.svg" alt="list-music">
                        <div class="info">
                            ${songDetails[1]}
                            <h5>${songDetails[0]}</h5>
                        </div> 
                        </li>`;
  }

  return songs;
}
async function getAlbums() {
  // let a = await fetch("http://192.168.1.39:3000/js_tutorials/spotfiy_clone/songs/");
  
  let a = await fetch("songs/");
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let albums = [];
  for (let i = 0; i < anchors.length; i++) {
    if (anchors[i].href.includes("/songs/") && !anchors[i].href.includes(".htaccess")) {
      albums.push(anchors[i].href);
    }
  }

  let cardConatiner = document.querySelector(".cardContainer");
  for (const album of albums) {
    let cardName = album
      .split("/songs/")[1]
      .replace("/", "")
      .replaceAll("%20", " ");
    cardConatiner.innerHTML += ` <div data-folder=${cardName.replaceAll(
      " ",
      "%20"
    )} class="card">
                            <img src="${album}cover.jpg">
                            <p>${cardName} </p>
                            <img class="playbtn" src="assests/images/playbtn.svg" alt="playbtn">
                        </div>  `;
  }
}

let songs = null;
let songListsUL = null;
let isPlaying = false;
let liactive = -1;
let audio = null;
let musicInfo = null;
let musicCurrTime = null;
let musicTotalTime = null;
let currFolder;
async function intialise() {
  await getAlbums();
  // songs = await getSongs("");
  // Ensure song lists are populated
  songListsUL = document.querySelectorAll(".songList li");
  musicInfo = document.querySelector(".right-box .playBar .musicInfo .info");
  musicCurrTime = document.querySelector(
    ".right-box .playBarCentre .progress .musicCurrTime"
  );
  musicTotalTime = document.querySelector(
    ".right-box .playBarCentre .progress .musicTotalTime"
  );
}

// Wrap everything in an async function to ensure proper order
async function addListeners() {
  await intialise(); // Ensure main is completed

  // Now we can safely set up controls and other listeners
  // Add event listeners after the song list is populated
  let buttonPlay = document.querySelector(".musicButtons .music-play");
  buttonPlay.addEventListener("click", buttonPlaycontrol);
  buttonPlay.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      buttonPlaycontrol;
    }
  });

  function buttonPlaycontrol() {
    if (isPlaying) {
      buttonPlay.innerHTML = `<img src="assests/images/Play-Pause-play.svg" alt="music-play">`;
      audio.pause();
      isPlaying = false;
    } else {
      buttonPlay.innerHTML = `<img src="assests/images/Play-Pause-pause.svg" alt="music-pause">`;
      playMusic();
    }
  }
  let prevBtn = document.querySelector(".musicButtons .prev");
  prevBtn.addEventListener("click", () => {
    if (!isPlaying) {
      buttonPlay.innerHTML = "";
      buttonPlay.innerHTML = `<img src="assests/images/Play-Pause-pause.svg" alt="music-pause">`;
      if (audio) audio.pause();
    }
    songListsUL[liactive].classList.remove("playing");
    if (liactive == 0) {
      liactive = songListsUL.length - 1;
    } else {
      liactive--;
    }
    if (audio) audio.pause();
    audio = null;
    audio = new Audio(songs[liactive]);
    playMusic();
    prevBtn.blur(); //to remove focus from the button
  });
  let nextBtn = document.querySelector(".musicButtons .next");
  nextBtn.addEventListener("click", () => {
    if (!isPlaying) {
      buttonPlay.innerHTML = "";
      buttonPlay.innerHTML = `<img src="assests/images/Play-Pause-pause.svg" alt="music-pause">`;
      if (audio) audio.pause();
    }
    songListsUL[liactive].classList.remove("playing");

    if (liactive == songListsUL.length - 1) {
      liactive = 0;
    } else {
      liactive++;
    }
    if (audio) audio.pause();
    audio = null;
    audio = new Audio(songs[liactive]);
    playMusic();
    nextBtn.blur();
  });
  function playMusic() {
    songListsUL[liactive].classList.add("playing");
    addMusicInfo(liactive);

    // Make sure the loadedmetadata event is set before playing
    //EVENT AND READY STATE WORK IN HARMONY
    //loadedmetadata event listener runs, it handles everything (playing the song and updating the duration), and the second check for readyState won't fire again because it's part of the same flow.
    audio.addEventListener("loadedmetadata", () => {
      console.log("Metadata loaded");
      addMusicDuration();
      audio.play(); // Play after metadata is loaded
    });

    // If the metadata is already available (cached), the loadedmetadata event might not fire,
    // so check the readyState to ensure metadata is loaded before playing
    if (audio.readyState >= 1) {
      // Metadata is already loaded
      console.log("Metadata already loaded");
      addMusicDuration();
      audio.play(); // Play if the metadata is already loaded
    }

    addMusicTime(); // Start updating current time
    isPlaying = true;

    audio.addEventListener("ended", () => {
      songListsUL[liactive].classList.remove("playing");

      if (liactive < songListsUL.length - 1) {
        liactive++; // Move to next song
      } else {
        liactive = 0; // Go back to the first song if it's the last one
      }

      audio = new Audio(songs[liactive]);
      playMusic(); // Play the next song
    });
  }
  function addMusicDuration() {
    // audio.addEventListener('loadedmetadata',()=>{
    musicTotalTime.innerHTML = formatTime(audio.duration);
    // })
  }
  function addMusicTime() {
    audio.addEventListener("timeupdate", () => {
      musicCurrTime.innerHTML = formatTime(audio.currentTime);
      document.querySelector(".progressBar .circle").style.left =
        (audio.currentTime / audio.duration) * 100 + "%";
      // window.requestAnimationFrame(addMusicTime);
    });
  }
  function addMusicInfo(index) {
    let songDetails = songs[index]
      .split(`/${currFolder}/`)[1]
      .replaceAll("%20", " ")
      .replace(".mp3", "")
      .split(` - `);
    musicInfo.innerHTML = `${songDetails[1]}
                    <h5>${songDetails[0]}</h5>`;
  }
  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min < 10 ? "0" + min : min}:${sec < 10 ? "0" + sec : sec}`;
  }
  document.querySelector(".progressBar").addEventListener("click", (e) => {
    let ratio = e.offsetX / e.target.getBoundingClientRect().width;
    document.querySelector(".progressBar .circle").style.left =
      ratio * 100 + "%";
    audio.currentTime = audio.duration * ratio;
  });

  //event listener for hamburger btn
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left-box").style.left = "2%";
  });
  document.querySelector(".cross").addEventListener("click", () => {
    document.querySelector(".left-box").style.left = "-100%";
  });

  //event listener for volume
  document.querySelector(".volume input").addEventListener("change", (e) => {
    // console.log(e.target.value)
    audio.volume = parseInt(e.target.value) / 100;
    if (audio.volume > 0) {
      document.querySelector(".volume img").src = document
        .querySelector(".volume img")
        .src.replace("mute.svg", "volume.svg");
    }
  });
  //event listener for mute
  document.querySelector(".volume img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      audio.volume = 0;
    } else {
      e.target.src = e.target.src.replace("mute", "volume");
      audio.volume = 0.1;
    }
  });

  //event listener for playlist card
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      //   if(isPlaying){
      //     audio.pause()
      //     buttonPlaycontrol()
      //   }
      songs = await getSongs(`${item.currentTarget.dataset.folder}`);
      // audio = new Audio(songs[0]); // Initialize the first song

      // Log the song list to check if it's being populated correctly
      songListsUL = document.querySelectorAll(".songList li");
      //   console.log(songListsUL);

      // Attach event listeners after the songs are populated
      for (let i = 0; i < songListsUL.length; i++) {
        let song = songListsUL[i];
        song.addEventListener("click", () => {
          if (audio != null) {
            audio.pause();
            audio = null;
            songListsUL[liactive].classList.remove("playing");
            isPlaying = false;
          }
          if (!isPlaying) {
            audio = new Audio(songs[i]);
            audio.preload = "metadata";
            liactive = i;
            buttonPlay.innerHTML = `<img src="assests/images/Play-Pause-pause.svg" alt="music-pause">`;
            song.classList.add("playing");
            playMusic();
          }
        });
      }
      showLeftBoxOnMobile();
    });
  });
  function showLeftBoxOnMobile() {
    // Check if screen width is less than or equal to 1024px (tablet/mobile mode)
    if (window.innerWidth <= 1024) {
      document.querySelector(".left-box").style.left = "2%";
    }
  }
}

// Initialize the player
addListeners();
