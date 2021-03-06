// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  Address,
  DataSourceTemplate,
  DataSourceContext
} from "@graphprotocol/graph-ts";

export class DVM extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("DVM", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext("DVM", [address.toHex()], context);
  }
}

export class DPP extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("DPP", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext("DPP", [address.toHex()], context);
  }
}

export class DSP extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("DSP", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext("DSP", [address.toHex()], context);
  }
}

export class CP extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("CP", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext("CP", [address.toHex()], context);
  }
}

export class DODO extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("DODO", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext("DODO", [address.toHex()], context);
  }
}

export class ERC20 extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("ERC20", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext("ERC20", [address.toHex()], context);
  }
}

export class DODOLpToken extends DataSourceTemplate {
  static create(address: Address): void {
    DataSourceTemplate.create("DODOLpToken", [address.toHex()]);
  }

  static createWithContext(address: Address, context: DataSourceContext): void {
    DataSourceTemplate.createWithContext(
      "DODOLpToken",
      [address.toHex()],
      context
    );
  }
}
