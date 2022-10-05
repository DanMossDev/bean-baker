//Canvas setup
const canvas = document.getElementById("display");
const renderer = PIXI.autoDetectRenderer({
  width: 1024,
  height: 512,
  backgroundAlpha: 0,
  resolution: 1,
});
canvas.appendChild(renderer.view);
canvas.onselectstart = () => false;
const stage = new PIXI.Container();
const loader = new PIXI.Loader();
loader
  .add("beans", "images/beans.png") //first argument is the name it will be accessed by in .resources
  .add("happy", "images/happybean.png")
  .add("button", "images/button.png")
  .load(setup);

//Some globals
let ticker = PIXI.Ticker.shared;
let beanCount;
let beanNum = 0;
let income = 0;

const beanArr = [];

//Initialises the game state
function setup() {
  stage.interactive = true;

  ticker.autoStart = false;
  ticker.stop();

  const baker = new Beaner("Baker", 10, 1);
  const beanCounter = new Beaner("Bean Counter", 100, 3, 2);
  const beanBagger = new Beaner("Bean Bagger", 1000, 12, 3);
  const seanBean = new Beaner("Sean Bean", 100000, 100, 4);

  let upgrades = [baker, beanCounter, beanBagger, seanBean];

  const beans = new PIXI.Sprite(loader.resources["beans"].texture);
  gsap.fromTo(beans, { angle: -5 }, { angle: 5, duration: 5, ease: "linear", yoyo: true, repeat: -1 });

  beans.interactive = true;
  beans.x = (renderer.width / 4) * 3;
  beans.y = renderer.height / 2;
  beans.scale.set(0.5);
  beans.anchor.set(0.5);

  // grab bean num from storage and add
  loadSave(upgrades);

  beans.pointerdown = ({ data }) => {
    beans.scale.set(0.495);
    beanNum++;
    beanCount.text = `Beans: ${beanNum} (${income} per second)`;

    beanArr.push(new BeanParticle(data.global.x, data.global.y));
  };
  beans.pointerup = () => {
    beans.scale.set(0.5);
  };

  beanCount = new PIXI.Text(`Beans: ${beanNum} (${income} per second)`, {
    fontFamily: "Courier New",
    fontWeight: "bold",
    fontSize: 24,
    fill: 0x42032c,
    align: "center",
  });
  beanCount.x = (renderer.width / 4) * 3;
  beanCount.y = renderer.height / 8;
  beanCount.anchor.set(0.5);

  ticker.add(() => {
    if (income != 0) {
      beanNum = beanNum + income / ticker.FPS;
      beanCount.text = `Beans: ${Math.round(beanNum)} (${income} per second)`;
      localStorage.setItem("savedBeans", Math.round(beanNum));
    }

    beanArr.forEach((bean, index) => {
      if (bean.texture) {
        bean.update();
      } else {
        beanArr.splice(index, index + 1);
      }
    });
  });
  ticker.start();

  stage.addChild(beans);
  stage.addChild(beanCount);
  animationLoop();
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  renderer.render(stage);
}

class Beaner {
  /**
   * @param {String} name - The name of the unit being built
   * @param {Number} baseCost - INTEGER - The initial cost of the unit, which will be multiplied based on number of units owned
   * @param {Number} baseIncome - INTEGER - The amount of income per second a single unit will generate
   * @param {Number} position - INTEGER - Determines how low down on the screen the unit is rendered relative to the others. Defaults to 1
   */
  constructor(name, baseCost, baseIncome, position = 1) {
    this.name = name;
    this.cost = baseCost;
    this.baseIncome = baseIncome;
    this.income = 0;
    this.count = 0;

    this.view = new PIXI.Container();

    this.stats = new PIXI.Text(`${this.name}: ${this.count}\nIncome: ${this.income}`, {
      fontFamily: "Courier New",
      fontWeight: "bold",
      fontSize: 24,
      fill: 0x42032c,
      align: "center",
    });
    this.buy = new PIXI.Text(`Buy(${this.cost} beans)`, {
      fontFamily: "Courier New",
      fontWeight: "bold",
      fontSize: 20,
      fill: 0x42032c,
      align: "center",
    });
    this.button = new PIXI.Sprite(loader.resources["button"].texture);
    this.buttonContainer = new PIXI.Container();
    this.buttonContainer.addChild(this.button);
    this.buttonContainer.addChild(this.buy);
    this.buttonContainer.interactive = true;
    this.stats.anchor.set(0.5);
    this.buy.anchor.set(0.5);
    this.button.anchor.set(0.5);
    this.button.scale.set(0.1, 0.075);

    this.stats.x = renderer.width / 8;
    this.stats.y = (renderer.height / 6) * position;
    this.buttonContainer.x = renderer.width / 2.7;
    this.buttonContainer.y = (renderer.height / 6) * position;

    this.view.addChild(this.stats);
    this.view.addChild(this.buttonContainer);

    this.handleClick();

    this.buttonContainer.pointerdown = () => {
      this.handleClick();
    };
    this.buttonContainer.pointerup = () => {
      this.buttonContainer.scale.set(1);
    };

    this.buttonContainer.scale.set(1);

    stage.addChild(this.view);
  }

  handleClick() {
    this.buttonContainer.scale.set(0.9);
    if (beanNum >= this.cost) {
      beanNum -= this.cost;
      this.cost = Math.floor(this.cost * 1.2);
      this.count++;
      this.income = this.baseIncome * this.count;
      income += this.baseIncome;
      beanCount.text = `Beans: ${beanNum} (${income} per second)`;
      this.stats.text = `${this.name}: ${this.count}\nIncome: ${this.income}`;
      this.buy.text = `Buy(${this.cost} beans)`;

      localStorage.setItem(this.name, this.count);
    }
  }
}

class BeanParticle {
  /**
   * @param {Number} xPos - The mouse's x position
   * @param {Number} yPos - The mouse's y position
   */
  constructor(xPos, yPos) {
    this.xSpeed = (Math.random() * 2 - 1) * 5;
    this.ySpeed = -5;

    this.texture = new PIXI.Sprite(loader.resources["happy"].texture);
    this.texture.x = xPos;
    this.texture.y = yPos;
    this.texture.anchor.set(0.5);
    this.texture.scale.set(0.1);

    stage.addChild(this.texture);
  }

  update() {
    if (this.texture) {
      this.texture.x += this.xSpeed;
      this.texture.y += this.ySpeed;
      this.ySpeed += 0.5;

      if (this.texture.y > 1000) {
        this.destroy();
      }
    }
  }

  destroy() {
    this.texture.destroy({ children: true });
    const keys = Object.keys(this);
    keys.forEach((key) => delete this[key]);
  }
}

function loadSave(upgrades) {
  // Load saved beans
  if (localStorage.getItem("savedBeans")) {
    beanNum = parseInt(localStorage.getItem("savedBeans"));
  }

  // Load saved upgrades
  upgrades.forEach((upgrade) => {
    let count = localStorage.getItem(upgrade.name);
    if (count) {
      upgrade.count = count;
      upgrade.income = upgrade.baseIncome * upgrade.count;
      upgrade.cost = Math.floor(upgrade.cost * Math.pow(1.2, count));

      income += upgrade.income;
      upgrade.stats.text = `${upgrade.name}: ${upgrade.count}\nIncome: ${upgrade.income}`;
      upgrade.buy.text = `Buy(${upgrade.cost} beans)`;
    }
  });
}
